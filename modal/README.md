# Modal GPU Services — Buildathon

Two services that run on Modal.com (serverless A10G GPUs):

## Services

### 1. Text-to-Motion (Kimodo)
- **App name:** `buildathon-text2motion`
- **Model:** Kimodo-SOMA-RP-v1.1 (NVIDIA)
- **Input:** Text prompt + duration (1-10s)
- **Output:** BVH file (77-joint SOMA skeleton, 30fps)
- **GPU:** A10G, ~30-60s inference

### 2. Motion Capture (GEM-X)
- **App name:** `buildathon-motion`
- **Model:** GEM-X + SOMA (NVIDIA)
- **Input:** Video (MP4, max 30s)
- **Output:** BVH file (78-joint SOMA skeleton)
- **GPU:** A10G, ~60-120s inference

## Prerequisites

```bash
pip install modal
modal token set
```

### Modal Secrets Required

Create these in the Modal dashboard (modal.com → Settings → Secrets):

**`r2-credentials`:**
```
R2_ACCOUNT_ID=33c7a387dae5a6c71638127a90f83e08
R2_ACCESS_KEY_ID=<create in CF dashboard>
R2_SECRET_ACCESS_KEY=<create in CF dashboard>
R2_BUCKET_NAME=buildathon
```

**`huggingface-secret`:**
```
HF_TOKEN=<your HF token>
```

## Deploy

```bash
cd modal

# First time: build image + cache models (~15-20 min)
modal run services/text2motion.py::setup_models

# Deploy services (gets you HTTPS endpoints)
modal deploy services/text2motion.py
modal deploy services/motion.py
```

After deploying, Modal prints the endpoint URLs. Give these to the backend person.

## Endpoint Specs (for backend team)

### POST `<MODAL_TEXT2MOTION_URL>`

```json
// Request
{
  "prompt": "a person walking forward confidently",
  "duration": 5.0,
  "num_denoising_steps": 150,
  "job_id": "uuid-from-backend",
  "webhook_url": "https://your-railway-app.up.railway.app/api/webhooks/modal",
}

// Response (immediate)
{
  "output_key": "outputs/<job_id>/animation.bvh",
  "bvh_key": "outputs/<job_id>/animation.bvh",
  "frames": 150,
  "fps": 30,
  "gpu_seconds": 42.5
}
```

### POST `<MODAL_MOTION_URL>`

```json
// Request
{
  "video_key": "uploads/<uuid>/input.mp4",
  "job_id": "uuid-from-backend",
  "webhook_url": "https://your-railway-app.up.railway.app/api/webhooks/modal",
  "options": { "fps": 24 }
}

// Response (immediate or via webhook)
{
  "output_key": "outputs/<job_id>/animation.bvh",
  "bvh_key": "outputs/<job_id>/animation.bvh",
  "frames": 240,
  "fps": 24,
  "person_count": 1,
  "gpu_seconds": 85.3
}
```

### Webhook Callback (Modal → Backend)

When a job completes, Modal POSTs to `webhook_url`:

```json
{
  "job_id": "uuid",
  "status": "completed",
  "output_key": "outputs/<job_id>/animation.bvh",
  "gpu_seconds": 42.5,
  "frames": 150,
  "fps": 30
}
```

Or on failure:
```json
{
  "job_id": "uuid",
  "status": "failed",
  "error": "GPU timeout"
}
```

## R2 Storage

- **Bucket:** `buildathon` (Cloudflare R2)
- **Uploads go to:** `uploads/<job_id>/<filename>`
- **Outputs go to:** `outputs/<job_id>/animation.bvh`
- Backend serves via presigned URLs

## BVH Format Notes

- SOMA skeleton: 77-78 joints (humanoid)
- Kimodo outputs have reference root stripped (ready for Three.js BVHLoader)
- GEM-X outputs may need stripping too (TBD at test time)
- Default FPS: 30 (Kimodo), configurable (GEM-X)
- Three.js BVHLoader reads these directly
