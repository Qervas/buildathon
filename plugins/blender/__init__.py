"""ohao Motion — AI Animation Tools for Blender

Generate skeletal animations from text or extract motion capture from video.
All processing runs on cloud GPUs via the ohao API.

Install: Edit > Preferences > Add-ons > Install... > select this folder
Shortcut: Ctrl+Shift+M for quick generate popup
"""

bl_info = {
    "name": "ohao Motion — AI Animation",
    "author": "Team ohao",
    "version": (0, 1, 0),
    "blender": (4, 0, 0),
    "location": "View3D > Sidebar > ohao | Ctrl+Shift+M",
    "description": "AI text-to-motion and video motion capture",
    "category": "Animation",
}

import bpy
from bpy.props import StringProperty, FloatProperty, BoolProperty
import json
import os
import threading
import tempfile
import time
from urllib.request import Request, urlopen

API_BASE = "https://backend-production-b095.up.railway.app"


# ── API Client ───────────────────────────────────────────────────────

def api_post(path, data, timeout=120):
    url = f"{API_BASE}{path}"
    body = json.dumps(data).encode()
    req = Request(url, data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    with urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read())


def api_get(path, timeout=30):
    url = f"{API_BASE}{path}"
    req = Request(url, method="GET")
    with urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read())


def download_bvh(result_url):
    url = f"{API_BASE}{result_url}"
    req = Request(url, method="GET")
    with urlopen(req, timeout=60) as resp:
        data = resp.read()
    tmp = tempfile.NamedTemporaryFile(suffix=".bvh", delete=False)
    tmp.write(data)
    tmp.close()
    return tmp.name


def import_bvh_on_main_thread(filepath):
    def _do():
        try:
            bpy.ops.import_anim.bvh(filepath=filepath, frame_start=1)
            for obj in bpy.context.selected_objects:
                if obj.type == 'ARMATURE':
                    bpy.context.view_layer.objects.active = obj
                    break
            print(f"ohao: BVH imported")
        except Exception as e:
            print(f"ohao: BVH import failed: {e}")
        finally:
            try:
                os.unlink(filepath)
            except OSError:
                pass
        return None
    bpy.app.timers.register(_do, first_interval=0.1)


# ── Shared generation state ─────────────────────────────────────────

_gen_state = {
    "running": False,
    "stage": "",
    "elapsed": 0,
    "start_time": 0,
    "error": "",
    "done": False,
}


def _draw_header_status(self, context):
    """Draw generation status in the 3D viewport header."""
    if not _gen_state["running"] and not _gen_state["done"]:
        return
    layout = self.layout
    if _gen_state["running"]:
        elapsed = int(time.time() - _gen_state["start_time"])
        layout.label(text=f"ohao: {_gen_state['stage']} ({elapsed}s)", icon='SORTTIME')
    elif _gen_state["done"]:
        if _gen_state["error"]:
            layout.label(text=f"ohao: {_gen_state['error']}", icon='ERROR')
        else:
            layout.label(text=f"ohao: {_gen_state['stage']}", icon='CHECKMARK')


# ── Modal timer that keeps the UI alive during generation ────────────

class OHAO_OT_ProgressTimer(bpy.types.Operator):
    """Keeps viewport refreshing while animation generates on GPU"""
    bl_idname = "ohao.progress_timer"
    bl_label = "ohao Progress"

    _timer = None

    def modal(self, context, event):
        if event.type == 'TIMER':
            # Force viewport redraw to update header status
            for area in context.screen.areas:
                if area.type == 'VIEW_3D':
                    area.tag_redraw()

            if not _gen_state["running"]:
                self.cancel(context)
                return {'FINISHED'}

        return {'PASS_THROUGH'}

    def execute(self, context):
        wm = context.window_manager
        self._timer = wm.event_timer_add(0.5, window=context.window)
        wm.modal_handler_add(self)
        return {'RUNNING_MODAL'}

    def cancel(self, context):
        if self._timer:
            context.window_manager.event_timer_remove(self._timer)


# ── Operators ────────────────────────────────────────────────────────

def _run_generation(prompt, duration):
    """Shared generation logic — runs in background thread."""
    _gen_state["running"] = True
    _gen_state["start_time"] = time.time()
    _gen_state["stage"] = "Submitting to GPU..."
    _gen_state["error"] = ""
    _gen_state["done"] = False

    try:
        result = api_post("/api/generate/text2motion", {
            "prompt": prompt,
            "duration": duration,
        })
        job_id = result.get("job_id", "")
        if not job_id:
            raise RuntimeError(result.get("error", "No job ID returned"))

        # Poll until done
        start = time.time()
        while time.time() - start < 180:
            elapsed = int(time.time() - _gen_state["start_time"])
            if elapsed < 5:
                _gen_state["stage"] = "Warming up GPU..."
            elif elapsed < 15:
                _gen_state["stage"] = "Loading Kimodo model..."
            elif elapsed < 35:
                _gen_state["stage"] = "Generating motion..."
            elif elapsed < 55:
                _gen_state["stage"] = "Denoising animation..."
            else:
                _gen_state["stage"] = "Finalizing BVH..."

            job = api_get(f"/api/jobs/{job_id}")
            if job.get("status") == "completed":
                result_url = job.get("result_url", "")
                meta = job.get("meta", {})
                frames = meta.get("frames", "?")
                fps = meta.get("fps", 30)

                _gen_state["stage"] = "Downloading BVH..."
                filepath = download_bvh(result_url)
                import_bvh_on_main_thread(filepath)

                _gen_state["stage"] = f"Done — {frames} frames @ {fps}fps"
                _gen_state["running"] = False
                _gen_state["done"] = True
                return

            if job.get("status") == "failed":
                raise RuntimeError(job.get("error", "Job failed"))

            time.sleep(2)

        raise RuntimeError("Timed out after 180s")

    except Exception as e:
        _gen_state["error"] = str(e)
        _gen_state["stage"] = f"Error: {e}"
        _gen_state["running"] = False
        _gen_state["done"] = True
        print(f"ohao: Error: {e}")


class OHAO_OT_TextToMotion(bpy.types.Operator):
    bl_idname = "ohao.text_to_motion"
    bl_label = "Generate Motion"
    bl_description = "Generate a skeletal animation from a text description (30-60s)"

    def execute(self, context):
        props = context.scene.ohao
        prompt = props.motion_prompt.strip()
        if not prompt:
            self.report({'WARNING'}, "Describe the motion first")
            return {'CANCELLED'}

        if _gen_state["running"]:
            self.report({'WARNING'}, "Generation already in progress")
            return {'CANCELLED'}

        duration = props.motion_duration
        self.report({'INFO'}, f"ohao: Generating '{prompt}' ({duration}s)...")

        # Start progress timer for UI updates
        bpy.ops.ohao.progress_timer()

        # Run generation in background thread
        thread = threading.Thread(target=_run_generation, args=(prompt, duration), daemon=True)
        thread.start()
        return {'FINISHED'}


class OHAO_OT_ExtractMotion(bpy.types.Operator):
    bl_idname = "ohao.extract_motion"
    bl_label = "Extract Motion from Video"
    bl_description = "Upload a video and extract motion capture data (1-2 min)"

    filepath: StringProperty(subtype='FILE_PATH')

    def invoke(self, context, event):
        context.window_manager.fileselect_add(self)
        return {'RUNNING_MODAL'}

    def execute(self, context):
        if not self.filepath:
            return {'CANCELLED'}

        if _gen_state["running"]:
            self.report({'WARNING'}, "Generation already in progress")
            return {'CANCELLED'}

        _gen_state["running"] = True
        _gen_state["start_time"] = time.time()
        _gen_state["stage"] = "Uploading video..."
        _gen_state["error"] = ""
        _gen_state["done"] = False

        bpy.ops.ohao.progress_timer()
        video_path = self.filepath

        def _run():
            try:
                with open(video_path, 'rb') as f:
                    video_data = f.read()

                size_mb = len(video_data) / (1024 * 1024)
                _gen_state["stage"] = f"Uploading {size_mb:.1f}MB..."

                filename = os.path.basename(video_path)
                boundary = "----OhaoUpload"
                body = (
                    f"--{boundary}\r\n"
                    f'Content-Disposition: form-data; name="video"; filename="{filename}"\r\n'
                    f"Content-Type: video/mp4\r\n\r\n"
                ).encode() + video_data + f"\r\n--{boundary}--\r\n".encode()

                req = Request(f"{API_BASE}/api/generate/motion", data=body, method="POST")
                req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")

                with urlopen(req, timeout=30) as resp:
                    result = json.loads(resp.read())

                job_id = result.get("job_id", "")
                if not job_id:
                    raise RuntimeError(result.get("error", "No job ID"))

                start = time.time()
                while time.time() - start < 300:
                    elapsed = int(time.time() - _gen_state["start_time"])
                    if elapsed < 10:
                        _gen_state["stage"] = "Preprocessing video..."
                    elif elapsed < 30:
                        _gen_state["stage"] = "Running GEM-X pose estimation..."
                    elif elapsed < 90:
                        _gen_state["stage"] = "Extracting SOMA skeleton..."
                    else:
                        _gen_state["stage"] = "Exporting BVH..."

                    job = api_get(f"/api/jobs/{job_id}")
                    if job.get("status") == "completed":
                        result_url = job.get("result_url", "")
                        meta = job.get("meta", {})
                        frames = meta.get("frames", "?")
                        fps = meta.get("fps", 30)

                        _gen_state["stage"] = "Downloading BVH..."
                        filepath = download_bvh(result_url)
                        import_bvh_on_main_thread(filepath)
                        _gen_state["stage"] = f"Done — {frames} frames @ {fps}fps"
                        _gen_state["running"] = False
                        _gen_state["done"] = True
                        return

                    if job.get("status") == "failed":
                        raise RuntimeError(job.get("error", "Job failed"))
                    time.sleep(3)

                raise RuntimeError("Timed out after 300s")
            except Exception as e:
                _gen_state["error"] = str(e)
                _gen_state["stage"] = f"Error: {e}"
                _gen_state["running"] = False
                _gen_state["done"] = True
                print(f"ohao: Error: {e}")

        threading.Thread(target=_run, daemon=True).start()
        return {'FINISHED'}


class OHAO_OT_TestConnection(bpy.types.Operator):
    bl_idname = "ohao.test_connection"
    bl_label = "Test Connection"

    def execute(self, context):
        try:
            result = api_get("/")
            self.report({'INFO'}, f"ohao: Connected — {result.get('status', 'OK')}")
        except Exception as e:
            self.report({'ERROR'}, f"ohao: Connection failed — {e}")
        return {'FINISHED'}


class OHAO_OT_QuickGenerate(bpy.types.Operator):
    """Quick popup — Ctrl+Shift+M"""
    bl_idname = "ohao.quick_generate"
    bl_label = "ohao: Generate Motion"

    prompt: StringProperty(name="Motion", default="")
    duration: FloatProperty(name="Duration (s)", default=4.0, min=1.0, max=10.0)

    def invoke(self, context, event):
        return context.window_manager.invoke_props_dialog(self, width=400)

    def draw(self, context):
        layout = self.layout
        layout.prop(self, "prompt", text="Describe motion")
        layout.prop(self, "duration")
        if _gen_state["running"]:
            layout.label(text=_gen_state["stage"], icon='SORTTIME')

    def execute(self, context):
        if not self.prompt.strip():
            self.report({'WARNING'}, "Enter a prompt")
            return {'CANCELLED'}
        context.scene.ohao.motion_prompt = self.prompt
        context.scene.ohao.motion_duration = self.duration
        bpy.ops.ohao.text_to_motion()
        return {'FINISHED'}


# ── Properties ───────────────────────────────────────────────────────

class OhaoProperties(bpy.types.PropertyGroup):
    motion_prompt: StringProperty(
        name="Motion",
        description="Describe the motion (e.g. 'person walking forward')",
        default="",
    )
    motion_duration: FloatProperty(
        name="Duration",
        description="Animation duration in seconds",
        default=4.0,
        min=1.0,
        max=10.0,
    )


# ── Panel ────────────────────────────────────────────────────────────

class OHAO_PT_MainPanel(bpy.types.Panel):
    bl_label = "ohao Motion"
    bl_idname = "OHAO_PT_main"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "ohao"

    def draw(self, context):
        layout = self.layout
        props = context.scene.ohao

        # Status bar
        if _gen_state["running"]:
            elapsed = int(time.time() - _gen_state["start_time"])
            box = layout.box()
            box.label(text=_gen_state["stage"], icon='SORTTIME')
            box.label(text=f"Elapsed: {elapsed}s")
            box.separator()
        elif _gen_state["done"]:
            box = layout.box()
            if _gen_state["error"]:
                box.label(text=_gen_state["stage"], icon='ERROR')
            else:
                box.label(text=_gen_state["stage"], icon='CHECKMARK')
            box.separator()

        # Text to Motion
        box = layout.box()
        box.label(text="Text to Motion", icon='ANIM_DATA')
        box.prop(props, "motion_prompt", text="")
        box.prop(props, "motion_duration")
        row = box.row()
        row.enabled = not _gen_state["running"]
        row.operator("ohao.text_to_motion", icon='PLAY')

        layout.separator()

        # Motion Capture
        box = layout.box()
        box.label(text="Video Motion Capture", icon='CAMERA_DATA')
        row = box.row()
        row.enabled = not _gen_state["running"]
        row.operator("ohao.extract_motion", text="Select Video...", icon='FILE_MOVIE')

        layout.separator()

        # Quick access
        layout.label(text="Shortcut: Ctrl+Shift+M", icon='EVENT_M')
        layout.operator("ohao.test_connection", text="Test Connection", icon='URL')


# ── Registration ─────────────────────────────────────────────────────

classes = (
    OhaoProperties,
    OHAO_OT_ProgressTimer,
    OHAO_OT_TextToMotion,
    OHAO_OT_ExtractMotion,
    OHAO_OT_TestConnection,
    OHAO_OT_QuickGenerate,
    OHAO_PT_MainPanel,
)

addon_keymaps = []


def register():
    for cls in classes:
        bpy.utils.register_class(cls)
    bpy.types.Scene.ohao = bpy.props.PointerProperty(type=OhaoProperties)

    # Header status
    bpy.types.VIEW3D_HT_header.append(_draw_header_status)

    # Ctrl+Shift+M shortcut
    wm = bpy.context.window_manager
    if wm.keyconfigs.addon:
        km = wm.keyconfigs.addon.keymaps.new(name='3D View', space_type='VIEW_3D')
        kmi = km.keymap_items.new('ohao.quick_generate', 'M', 'PRESS', ctrl=True, shift=True)
        addon_keymaps.append((km, kmi))

    print("ohao Motion plugin registered — Ctrl+Shift+M for quick generate")


def unregister():
    bpy.types.VIEW3D_HT_header.remove(_draw_header_status)

    for km, kmi in addon_keymaps:
        km.keymap_items.remove(kmi)
    addon_keymaps.clear()

    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)
    del bpy.types.Scene.ohao
    print("ohao Motion plugin unregistered")


if __name__ == "__main__":
    register()
