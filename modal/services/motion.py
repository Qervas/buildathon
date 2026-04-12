"""Buildathon Motion Capture — GEM-X + SOMA (NVIDIA, Apache 2.0)

Video → 78-joint BVH with world-space coordinates.

Deploy: cd modal && modal deploy services/motion.py
"""
import modal

app = modal.App("buildathon-motion")
volume = modal.Volume.from_name("gemx-models", create_if_missing=True)

CHECKPOINTS_PATH = "/checkpoints"

image_def = (
    modal.Image.from_registry(
        "nvidia/cuda:12.6.3-cudnn-devel-ubuntu22.04",
        add_python="3.11",
    )
    .apt_install("git", "git-lfs", "ffmpeg", "libgl1-mesa-glx", "libglib2.0-0")
    .pip_install(
        "torch==2.10.0+cu126",
        "torchvision==0.25.0+cu126",
        extra_index_url="https://download.pytorch.org/whl/cu126",
    )
    .pip_install(
        "numpy==1.23.5", "scipy", "pillow", "tqdm", "pyyaml",
        "opencv-python-headless", "ffmpeg-python", "einops", "imageio",
        "av", "safetensors", "trimesh", "transformers", "timm==0.6.7",
        "lightning", "hydra-core", "hydra-colorlog", "rich",
        "onnxruntime-gpu", "termcolor", "pyquaternion",
        "httpx", "boto3", "fastapi[standard]",
        "cloudpickle", "fvcore", "iopath", "pycocotools",
        "braceexpand", "roma", "setuptools<75",
    )
    .run_commands(
        "pip install 'git+https://github.com/facebookresearch/detectron2.git@a1ce2f9' "
        "--no-build-isolation --no-deps || echo 'detectron2 skipped'",
    )
    .run_commands(
        "cd /opt && git clone --depth 1 https://github.com/NVlabs/GEM-X.git",
        "cd /opt/GEM-X/third_party && rm -rf soma && git clone --depth 1 https://github.com/NVlabs/SOMA-X.git soma",
        "cd /opt/GEM-X/third_party && rm -rf sam-3d-body && git clone --depth 1 https://github.com/facebookresearch/sam-3d-body.git",
        "cd /opt/GEM-X/third_party && rm -rf soma-retargeter && git clone --depth 1 https://github.com/NVIDIA/soma-retargeter.git || true",
        "cd /opt/GEM-X/third_party/soma && git lfs pull",
        "cd /opt/GEM-X && pip install -e third_party/soma",
        "cd /opt/GEM-X && pip install -e third_party/soma-retargeter || true",
        "cd /opt/GEM-X && pip install -e .",
        "sed -i \"s/from soma_retargeter.pipelines.newton_pipeline import NewtonPipeline/try:\\n    from soma_retargeter.pipelines.newton_pipeline import NewtonPipeline\\nexcept ImportError:\\n    NewtonPipeline = None/\" /opt/GEM-X/scripts/demo/retarget_utils.py || true",
        "sed -i \"s/from soma_retargeter.robotics.csv_animation_buffer import CSVAnimationBuffer/try:\\n    from soma_retargeter.robotics.csv_animation_buffer import CSVAnimationBuffer\\nexcept ImportError:\\n    CSVAnimationBuffer = None/\" /opt/GEM-X/scripts/demo/retarget_utils.py || true",
    )
    .add_local_file("shared_r2.py", "/root/shared_r2.py", copy=True)
    .add_local_file("core/__init__.py", "/root/core/__init__.py", copy=True)
    .add_local_file("core/base.py", "/root/core/base.py", copy=True)
    .env({
        "PYTHONPATH": "/root:/opt/GEM-X:/opt/GEM-X/third_party/sam-3d-body:/opt/GEM-X/third_party/soma-retargeter:/opt/GEM-X/scripts/demo",
    })
)


@app.cls(
    image=image_def,
    gpu="A10G",
    volumes={CHECKPOINTS_PATH: volume},
    timeout=300,
    scaledown_window=120,
    secrets=[modal.Secret.from_name("r2-credentials")],
)
class MotionService:
    @modal.enter()
    def load_model(self):
        import sys
        sys.path.insert(0, "/opt/GEM-X")
        sys.path.insert(0, "/opt/GEM-X/third_party/sam-3d-body")
        sys.path.insert(0, "/opt/GEM-X/third_party/soma-retargeter")
        sys.path.insert(0, "/opt/GEM-X/scripts/demo")
        from gem.utils.soma_utils.soma_layer import SomaLayer
        print("GEM-X + SOMA loaded (A10G)")

    @modal.fastapi_endpoint(method="POST")
    def generate(self, request: dict) -> dict:
        from core.base import BaseService
        base = BaseService()
        result = base.safe_generate(lambda: self._generate(request, base))
        base.send_webhook(request, result)
        return result

    def _generate(self, request: dict, base) -> dict:
        import sys, subprocess, tempfile, shutil, torch
        from pathlib import Path

        sys.path.insert(0, "/opt/GEM-X")
        sys.path.insert(0, "/opt/GEM-X/third_party/sam-3d-body")
        sys.path.insert(0, "/opt/GEM-X/third_party/soma-retargeter")
        sys.path.insert(0, "/opt/GEM-X/scripts/demo")

        job_id = request.get("job_id", "unknown")
        video_key = request.get("video_key")
        video_url = request.get("video_url")
        options = request.get("options", {})
        fps = options.get("fps", 24)

        work_dir = Path(tempfile.mkdtemp())
        input_video = work_dir / "input.mp4"

        if video_key:
            input_video.write_bytes(base.fetch_from_r2(video_key))
        elif video_url:
            import httpx
            with httpx.Client(timeout=120) as client:
                resp = client.get(video_url)
                resp.raise_for_status()
                input_video.write_bytes(resp.content)
        else:
            raise ValueError("video_key or video_url required")

        raw_size = input_video.stat().st_size / 1024 / 1024
        print(f"Video: {raw_size:.1f} MB")

        # Preprocess: downscale to 720p max, cap 30s, drop audio
        preprocessed = work_dir / "preprocessed.mp4"
        subprocess.run([
            "ffmpeg", "-y", "-i", str(input_video),
            "-vf", "scale=-2:min'(ih,720)'",
            "-t", "30",
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-an",
            str(preprocessed),
        ], capture_output=True, timeout=60)

        if preprocessed.exists() and preprocessed.stat().st_size > 1000:
            new_size = preprocessed.stat().st_size / 1024 / 1024
            print(f"Preprocessed: {raw_size:.1f}MB -> {new_size:.1f}MB")
            input_video = preprocessed

        output_dir = work_dir / "output"
        output_dir.mkdir()

        print("Running GEM-X...")
        env = {**__import__('os').environ}
        env["PYTHONPATH"] = "/opt/GEM-X:/opt/GEM-X/third_party/sam-3d-body"
        subprocess.run([
            sys.executable, "/opt/GEM-X/scripts/demo/demo_soma.py",
            "--video", str(input_video),
            "--output_root", str(output_dir),
        ], capture_output=True, text=True, timeout=240, env=env)

        results_path = None
        for pt in output_dir.rglob("hpe_results.pt"):
            results_path = pt
            break
        if results_path is None:
            raise RuntimeError("GEM-X produced no results")

        # NOTE: torch.load with weights_only=False is required here because
        # GEM-X saves results as a dict of tensors via torch.save, which
        # uses pickle internally. This is trusted model output, not user input.
        data = torch.load(results_path, map_location="cpu", weights_only=False)
        gp = data["body_params_global"]
        num_frames = gp["body_pose"].shape[0]
        print(f"Extracted {num_frames} frames")

        print("Exporting BVH...")
        from retarget_utils import build_soma_skeleton_from_model, export_soma_bvh
        skeleton = build_soma_skeleton_from_model(gp["identity_coeffs"], gp["scale_params"])
        bvh_path = work_dir / "animation.bvh"
        export_soma_bvh(gp, skeleton, fps=float(fps), output_bvh_path=str(bvh_path))

        bvh_bytes = bvh_path.read_bytes()
        output_key = base.upload_result(bvh_bytes, "animation.bvh", "application/octet-stream", job_id)

        shutil.rmtree(work_dir, ignore_errors=True)

        return {
            "output_key": output_key,
            "bvh_key": output_key,
            "frames": num_frames,
            "fps": fps,
            "person_count": 1,
        }
