"""ohao Motion — AI Animation Tools for Blender

Generate skeletal animations from text or extract motion capture from video.
All processing runs on cloud GPUs via the ohao API.

Install: Edit > Preferences > Add-ons > Install... > select this folder
"""

bl_info = {
    "name": "ohao Motion — AI Animation",
    "author": "Team ohao",
    "version": (0, 1, 0),
    "blender": (4, 0, 0),
    "location": "View3D > Sidebar > ohao",
    "description": "AI text-to-motion and video motion capture",
    "category": "Animation",
}

import bpy
from bpy.props import StringProperty, FloatProperty
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
    """Download BVH via the media redirect endpoint."""
    url = f"{API_BASE}{result_url}"
    req = Request(url, method="GET")
    # Follow redirect to R2 presigned URL
    with urlopen(req, timeout=60) as resp:
        data = resp.read()
    tmp = tempfile.NamedTemporaryFile(suffix=".bvh", delete=False)
    tmp.write(data)
    tmp.close()
    return tmp.name


def poll_job(job_id, timeout_s=180):
    """Poll until job completes or fails."""
    start = time.time()
    while time.time() - start < timeout_s:
        job = api_get(f"/api/jobs/{job_id}")
        status = job.get("status", "")
        if status == "completed":
            return job
        if status == "failed":
            raise RuntimeError(job.get("error", "Job failed"))
        time.sleep(3)
    raise RuntimeError(f"Job {job_id} timed out after {timeout_s}s")


def import_bvh_on_main_thread(filepath):
    """Schedule BVH import on Blender's main thread."""
    def _do():
        try:
            bpy.ops.import_anim.bvh(filepath=filepath, frame_start=1)
            # Select the imported armature
            for obj in bpy.context.selected_objects:
                if obj.type == 'ARMATURE':
                    bpy.context.view_layer.objects.active = obj
                    break
            print(f"ohao: BVH imported from {filepath}")
        except Exception as e:
            print(f"ohao: BVH import failed: {e}")
        finally:
            try:
                os.unlink(filepath)
            except OSError:
                pass
        return None

    bpy.app.timers.register(_do, first_interval=0.1)


# ── Operators ────────────────────────────────────────────────────────

class OHAO_OT_TextToMotion(bpy.types.Operator):
    bl_idname = "ohao.text_to_motion"
    bl_label = "Generate Motion"
    bl_description = "Generate a skeletal animation from a text description (30-60s)"

    _thread = None

    def execute(self, context):
        props = context.scene.ohao
        prompt = props.motion_prompt.strip()
        if not prompt:
            self.report({'WARNING'}, "Describe the motion first")
            return {'CANCELLED'}

        duration = props.motion_duration
        self.report({'INFO'}, f"Generating: '{prompt}' ({duration}s)...")
        props.status = "Generating motion on GPU..."

        def _run():
            try:
                result = api_post("/api/generate/text2motion", {
                    "prompt": prompt,
                    "duration": duration,
                })
                job_id = result.get("job_id", "")
                if not job_id:
                    props.status = f"Error: {result.get('error', 'No job ID')}"
                    return

                props.status = f"Processing on GPU (job {job_id[:8]}...)"
                job = poll_job(job_id)

                result_url = job.get("result_url", "")
                meta = job.get("meta", {})
                frames = meta.get("frames", "?")
                fps = meta.get("fps", 30)

                props.status = f"Downloading BVH ({frames} frames @ {fps}fps)..."
                filepath = download_bvh(result_url)
                import_bvh_on_main_thread(filepath)
                props.status = f"Done — {frames} frames @ {fps}fps"

            except Exception as e:
                props.status = f"Error: {e}"
                print(f"ohao: Error: {e}")

        thread = threading.Thread(target=_run, daemon=True)
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

        props = context.scene.ohao
        props.status = "Uploading video..."

        def _run():
            try:
                # Read video
                with open(self.filepath, 'rb') as f:
                    video_data = f.read()

                size_mb = len(video_data) / (1024 * 1024)
                props.status = f"Uploading {size_mb:.1f}MB..."

                # Upload to R2 via backend
                import base64
                filename = os.path.basename(self.filepath)
                # For now, use the direct video_url approach
                # Save to temp and use a data URI (not ideal, but works for demo)
                tmp_video = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
                tmp_video.write(video_data)
                tmp_video.close()

                # Upload via multipart
                import urllib.request
                boundary = "----OhaoUpload"
                body = (
                    f"--{boundary}\r\n"
                    f'Content-Disposition: form-data; name="video"; filename="{filename}"\r\n'
                    f"Content-Type: video/mp4\r\n\r\n"
                ).encode() + video_data + f"\r\n--{boundary}--\r\n".encode()

                req = Request(
                    f"{API_BASE}/api/generate/motion",
                    data=body,
                    method="POST",
                )
                req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")

                with urlopen(req, timeout=30) as resp:
                    result = json.loads(resp.read())

                job_id = result.get("job_id", "")
                if not job_id:
                    props.status = f"Error: {result.get('error', 'No job ID')}"
                    return

                props.status = f"Extracting motion on GPU (1-2 min)..."
                job = poll_job(job_id, timeout_s=300)

                result_url = job.get("result_url", "")
                meta = job.get("meta", {})
                frames = meta.get("frames", "?")
                fps = meta.get("fps", 30)

                props.status = f"Downloading BVH ({frames} frames @ {fps}fps)..."
                filepath = download_bvh(result_url)
                import_bvh_on_main_thread(filepath)
                props.status = f"Done — {frames} frames @ {fps}fps"

                os.unlink(tmp_video.name)
            except Exception as e:
                props.status = f"Error: {e}"
                print(f"ohao: Error: {e}")

        thread = threading.Thread(target=_run, daemon=True)
        thread.start()
        return {'FINISHED'}


class OHAO_OT_TestConnection(bpy.types.Operator):
    bl_idname = "ohao.test_connection"
    bl_label = "Test Connection"

    def execute(self, context):
        try:
            result = api_get("/")
            context.scene.ohao.status = f"Connected: {result.get('status', 'OK')}"
            self.report({'INFO'}, "Connected to ohao API")
        except Exception as e:
            context.scene.ohao.status = f"Connection failed"
            self.report({'ERROR'}, f"Connection failed: {e}")
        return {'FINISHED'}


class OHAO_OT_QuickGenerate(bpy.types.Operator):
    """Quick popup to generate motion — press Ctrl+Shift+M"""
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
    status: StringProperty(
        name="Status",
        default="Ready",
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

        # Status
        row = layout.row()
        row.label(text=props.status, icon='INFO')

        layout.separator()

        # Text to Motion
        box = layout.box()
        box.label(text="Text to Motion", icon='ANIM_DATA')
        box.prop(props, "motion_prompt", text="")
        box.prop(props, "motion_duration")
        box.operator("ohao.text_to_motion", icon='PLAY')

        layout.separator()

        # Motion Capture
        box = layout.box()
        box.label(text="Video Motion Capture", icon='CAMERA_DATA')
        box.operator("ohao.extract_motion", text="Select Video...", icon='FILE_MOVIE')

        layout.separator()

        # Connection test
        layout.operator("ohao.test_connection", text="Test Connection", icon='URL')


# ── Registration ─────────────────────────────────────────────────────

classes = (
    OhaoProperties,
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

    # Register Ctrl+Shift+M shortcut for quick generate popup
    wm = bpy.context.window_manager
    if wm.keyconfigs.addon:
        km = wm.keyconfigs.addon.keymaps.new(name='3D View', space_type='VIEW_3D')
        kmi = km.keymap_items.new('ohao.quick_generate', 'M', 'PRESS', ctrl=True, shift=True)
        addon_keymaps.append((km, kmi))

    print("ohao Motion plugin registered — Ctrl+Shift+M for quick generate")


def unregister():
    for km, kmi in addon_keymaps:
        km.keymap_items.remove(kmi)
    addon_keymaps.clear()

    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)
    del bpy.types.Scene.ohao
    print("ohao Motion plugin unregistered")


if __name__ == "__main__":
    register()
