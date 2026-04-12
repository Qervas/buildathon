"""Buildathon Text-to-Motion — Kimodo (NVIDIA, NVIDIA Open Model License)

Text prompt → 77-joint SOMA BVH animation.

Deploy:  cd modal && modal deploy services/text2motion.py
Setup:   modal run services/text2motion.py::setup_models
"""
import modal

app = modal.App("buildathon-text2motion")
volume = modal.Volume.from_name("kimodo-models", create_if_missing=True)

CHECKPOINTS_PATH = "/checkpoints"
MODEL_ID = "Kimodo-SOMA-RP-v1.1"

image_def = (
    modal.Image.from_registry(
        "nvidia/cuda:12.4.1-cudnn-devel-ubuntu22.04",
        add_python="3.10",
    )
    .apt_install("git", "cmake", "build-essential")
    .pip_install(
        "torch==2.3.0",
        extra_index_url="https://download.pytorch.org/whl/cu121",
    )
    .pip_install(
        "git+https://github.com/nv-tlabs/kimodo.git",
        "httpx",
        "fastapi[standard]",
        "boto3",
    )
    .run_commands(
        "pip install transformers==4.51.3",
    )
    .add_local_file("shared_r2.py", "/root/shared_r2.py", copy=True)
    .add_local_file("core/__init__.py", "/root/core/__init__.py", copy=True)
    .add_local_file("core/base.py", "/root/core/base.py", copy=True)
    .add_local_file("scripts/download_llama_mirror.py", "/root/scripts/download_llama_mirror.py", copy=True)
    .run_commands(
        "python /root/scripts/download_llama_mirror.py",
        "python -c 'from huggingface_hub import snapshot_download; snapshot_download(\"McGill-NLP/LLM2Vec-Meta-Llama-3-8B-Instruct-mntp\")'",
        "python -c 'from huggingface_hub import snapshot_download; snapshot_download(\"McGill-NLP/LLM2Vec-Meta-Llama-3-8B-Instruct-mntp-supervised\")'",
        "python -c 'from huggingface_hub import snapshot_download; snapshot_download(\"nvidia/Kimodo-SOMA-RP-v1.1\")'",
    )
    .env({
        "PYTHONPATH": "/root",
        "TEXT_ENCODER_MODE": "local",
    })
)


@app.function(
    image=image_def,
    gpu="A10G",
    volumes={CHECKPOINTS_PATH: volume},
    timeout=1800,
    secrets=[modal.Secret.from_name("huggingface-secret", required_keys=["HF_TOKEN"])],
)
def setup_models():
    """Test model loading. Models are pre-downloaded in the image build."""
    import os
    os.environ["HF_HUB_OFFLINE"] = "1"

    from kimodo import load_model
    print(f"Loading {MODEL_ID}...")
    model = load_model(MODEL_ID, device="cuda:0")
    print(f"Model loaded: {MODEL_ID}")
    print(f"Skeleton: {model.skeleton.__class__.__name__}")
    print(f"FPS: {model.fps}")

    volume.commit()
    print("Kimodo models cached!")
    return {"status": "ok", "model": MODEL_ID}


@app.cls(
    image=image_def,
    gpu="A10G",
    volumes={CHECKPOINTS_PATH: volume},
    timeout=120,
    scaledown_window=120,
    secrets=[
        modal.Secret.from_name("r2-credentials"),
        modal.Secret.from_name("huggingface-secret", required_keys=["HF_TOKEN"]),
    ],
)
class KimodoService:
    @modal.enter()
    def load_model(self):
        import os
        os.environ["HF_HUB_OFFLINE"] = "1"

        from kimodo import load_model as _load
        self.model = _load(MODEL_ID, device="cuda:0")
        print(f"Kimodo {MODEL_ID} loaded (A10G)")

    @modal.fastapi_endpoint(method="POST")
    def generate(self, request: dict) -> dict:
        from core.base import BaseService
        base = BaseService()
        result = base.safe_generate(lambda: self._generate(request, base))
        base.send_webhook(request, result)
        return result

    def _generate(self, request: dict, base) -> dict:
        import torch
        from kimodo.exports.bvh import motion_to_bvh_bytes
        from kimodo.skeleton import global_rots_to_local_rots, SOMASkeleton30

        prompt = request.get("prompt", "")
        if not prompt:
            raise ValueError("prompt required")

        duration = request.get("duration", 5.0)
        num_frames = int(duration * self.model.fps)
        num_frames = max(30, min(300, num_frames))  # 1-10 seconds
        steps = request.get("num_denoising_steps", 150)

        print(f"Generating: '{prompt[:60]}', {num_frames} frames ({duration}s)")

        output = self.model(
            prompts=prompt,
            num_frames=num_frames,
            num_denoising_steps=steps,
            num_samples=1,
            post_processing=True,
            return_numpy=True,
        )

        skeleton = self.model.skeleton
        if isinstance(skeleton, SOMASkeleton30):
            skeleton = skeleton.somaskel77.to("cuda:0")

        joints_pos = torch.from_numpy(output["posed_joints"][0]).to("cuda:0")
        joints_rot = torch.from_numpy(output["global_rot_mats"][0]).to("cuda:0")
        local_rot_mats = global_rots_to_local_rots(joints_rot, skeleton)
        root_positions = joints_pos[:, skeleton.root_idx, :]

        bvh_bytes = motion_to_bvh_bytes(local_rot_mats, root_positions, skeleton=skeleton, fps=self.model.fps)

        # Fix SOMA BVH: strip reference bone + scale cm→m
        from core.base import strip_reference_root, scale_bvh_to_meters
        bvh_bytes = strip_reference_root(bvh_bytes)
        bvh_bytes = scale_bvh_to_meters(bvh_bytes)

        torch.cuda.empty_cache()

        import uuid
        job_id = request.get("job_id") or str(uuid.uuid4())
        output_key = base.upload_result(bvh_bytes, "animation.bvh", "text/plain", job_id)

        fps = int(self.model.fps)
        frames = output["posed_joints"].shape[1]
        print(f"Output: {frames} frames @ {fps}fps, {len(bvh_bytes)} bytes")

        return {
            "output_key": output_key,
            "bvh_key": output_key,
            "frames": frames,
            "fps": fps,
        }


