# Backend Developer Guide

> **Stack:** FastAPI + PostgreSQL + Cloudflare R2
> **Deploy:** Railway (auto-deploys on push to `main`)
> **Branch:** work on `main` or your own branch

---

## Tested Modal Endpoints (LIVE — verified 2026-04-12)

| Service | Endpoint | Tested Input | Result |
|---------|----------|-------------|--------|
| **Text-to-Motion** | `POST https://qervas--buildathon-text2motion-kimodoservice-generate.modal.run` | `{"prompt": "a person waving hello", "duration": 2.0}` | 60 frames @ 30fps, 3.85s GPU |
| **Motion Capture** | `POST https://qervas--buildathon-motion-motionservice-generate.modal.run` | `{"video_key": "uploads/test/walk.mp4", "options": {"fps": 30}}` | 255 frames @ 30fps, 118s GPU |

Both write BVH files to the `buildathon` R2 bucket at `outputs/<job_id>/animation.bvh`.

---

## Quick Start

```bash
git clone https://github.com/Qervas/buildathon.git
cd buildathon
# Create backend dir
mkdir -p backend && cd backend
python -m venv .venv && source .venv/bin/activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary boto3 httpx python-multipart pydantic
```

---

## Architecture

```
Frontend (CF Pages)
    │
    ▼  HTTPS
┌──────────────────────────────────────────────────┐
│  FastAPI Backend (Railway)                        │
│                                                   │
│  POST /api/generate/text2motion ──┐               │
│  POST /api/generate/motion ───────┼─► Modal GPU   │
│  GET  /api/jobs/{id}              │   (returns     │
│  POST /api/webhooks/modal ◄───────┘    via webhook)│
│  GET  /api/media/{key}                            │
│                                                   │
│  PostgreSQL (jobs table)                          │
│  R2 Client (presigned URLs)                       │
└──────────────────────────────────────────────────┘
```

---

## Environment Variables (Already Set on Railway)

These are pre-configured — you don't need to set them. Use them via `os.environ`:

```
DATABASE_URL=postgresql://buildathon:buildathon2026@postgres.railway.internal:5432/buildathon
MODAL_TEXT2MOTION_URL=https://qervas--buildathon-text2motion-kimodoservice-generate.modal.run
MODAL_MOTION_URL=https://qervas--buildathon-motion-motionservice-generate.modal.run
R2_ACCOUNT_ID=33c7a387dae5a6c71638127a90f83e08
R2_ACCESS_KEY_ID=b3807de72e09f1915f3018291605d2e4
R2_SECRET_ACCESS_KEY=71790c079c46fd9889a573410ec18a8b7592b36338c00ed13727abff24972307
R2_BUCKET_NAME=buildathon
WEBHOOK_SECRET=buildathon-wh-2026
FRONTEND_URL=https://buildathon-bii.pages.dev
PORT=8000
```

For local dev, copy these into a `.env` file (already in `.gitignore`).

---

## Project Structure

```
backend/
├── main.py                 # FastAPI app, CORS, router includes
├── config.py               # Read env vars
├── db.py                   # SQLAlchemy engine + Job model + init
├── r2.py                   # R2 presigned URL + upload helpers
├── modal_client.py         # HTTP client to call Modal endpoints
├── routes/
│   ├── generate.py         # POST /api/generate/*
│   ├── jobs.py             # GET /api/jobs/{id}
│   ├── webhooks.py         # POST /api/webhooks/modal
│   └── media.py            # GET /api/media/{key}
├── requirements.txt
└── Dockerfile
```

---

## Database: Jobs Table

One table. That's it.

```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL,            -- 'text2motion' or 'motion'
    status VARCHAR(20) DEFAULT 'pending', -- pending → processing → completed / failed
    input_params JSONB NOT NULL,          -- {"prompt": "...", "duration": 5.0}
    result_key TEXT,                      -- R2 key: "outputs/<uuid>/animation.bvh"
    result_meta JSONB,                    -- {"frames": 150, "fps": 30}
    error TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

SQLAlchemy model:

```python
from sqlalchemy import Column, String, DateTime, JSON, func
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Job(Base):
    __tablename__ = "jobs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(String(20), nullable=False)
    status = Column(String(20), default="pending")
    input_params = Column(JSON, nullable=False)
    result_key = Column(String)
    result_meta = Column(JSON)
    error = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime)
```

---

## Endpoints to Implement

### 1. `POST /api/generate/text2motion`

Frontend sends a text prompt. You create a job, call Modal, return the job ID.

```python
@router.post("/api/generate/text2motion")
async def text2motion(request: TextToMotionRequest):
    # 1. Create job in DB
    job = Job(type="text2motion", status="processing", input_params=request.dict())
    db.add(job)
    db.commit()

    # 2. Call Modal (fire and forget via webhook, or wait for response)
    result = await modal_client.text2motion(
        prompt=request.prompt,
        duration=request.duration,
        job_id=str(job.id),
        webhook_url=f"{BACKEND_URL}/api/webhooks/modal?token={WEBHOOK_SECRET}",
    )

    # 3. If Modal returned immediately (fast generation), update job now
    if "output_key" in result and "error" not in result:
        job.status = "completed"
        job.result_key = result["output_key"]
        job.result_meta = {"frames": result["frames"], "fps": result["fps"]}
        job.completed_at = datetime.utcnow()
        db.commit()

    return {"job_id": str(job.id)}
```

**Request body:**
```json
{
  "prompt": "a person walking forward confidently",
  "duration": 5.0
}
```

**Response:**
```json
{ "job_id": "d5cf687a-358b-451d-99dc-32e517430898" }
```

### 2. `POST /api/generate/motion`

Frontend uploads a video. You upload it to R2, create a job, call Modal.

```python
@router.post("/api/generate/motion")
async def motion_capture(video: UploadFile):
    # 1. Upload video to R2
    video_bytes = await video.read()
    video_key = f"uploads/{uuid4()}/{video.filename}"
    r2_upload(video_key, video_bytes, video.content_type or "video/mp4")

    # 2. Create job
    job = Job(type="motion", status="processing", input_params={"video_key": video_key})
    db.add(job)
    db.commit()

    # 3. Call Modal
    await modal_client.motion(
        video_key=video_key,
        job_id=str(job.id),
        webhook_url=f"{BACKEND_URL}/api/webhooks/modal?token={WEBHOOK_SECRET}",
    )

    return {"job_id": str(job.id)}
```

### 3. `GET /api/jobs/{job_id}`

Frontend polls this every 2 seconds until status is `completed` or `failed`.

```python
@router.get("/api/jobs/{job_id}")
async def get_job(job_id: UUID):
    job = db.query(Job).get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")

    response = {
        "id": str(job.id),
        "type": job.type,
        "status": job.status,
        "created_at": job.created_at.isoformat(),
    }
    if job.status == "completed":
        response["result_url"] = f"/api/media/{job.result_key}"
        response["meta"] = job.result_meta
    if job.status == "failed":
        response["error"] = job.error
    return response
```

**Response (completed):**
```json
{
  "id": "d5cf687a-...",
  "type": "text2motion",
  "status": "completed",
  "created_at": "2026-04-12T10:00:00",
  "result_url": "/api/media/outputs/d5cf687a-.../animation.bvh",
  "meta": { "frames": 60, "fps": 30 }
}
```

### 4. `POST /api/webhooks/modal`

Modal calls this when a GPU job finishes. Update the job in DB.

```python
@router.post("/api/webhooks/modal")
async def modal_webhook(token: str, payload: dict):
    if token != WEBHOOK_SECRET:
        raise HTTPException(403, "Invalid token")

    job = db.query(Job).get(payload["job_id"])
    if not job:
        raise HTTPException(404)

    if payload["status"] == "completed":
        job.status = "completed"
        job.result_key = payload["output_key"]
        job.result_meta = {
            "frames": payload.get("frames"),
            "fps": payload.get("fps"),
            "gpu_seconds": payload.get("gpu_seconds"),
        }
        job.completed_at = datetime.utcnow()
    else:
        job.status = "failed"
        job.error = payload.get("error", "Unknown error")

    db.commit()
    return {"ok": True}
```

### 5. `GET /api/media/{key:path}`

Serve assets from R2 via presigned URL redirect.

```python
@router.get("/api/media/{key:path}")
async def get_media(key: str):
    url = r2_presigned_url(key, expires=3600)
    return RedirectResponse(url)
```

---

## Calling Modal (modal_client.py)

```python
import httpx
import os

MODAL_TEXT2MOTION_URL = os.environ["MODAL_TEXT2MOTION_URL"]
MODAL_MOTION_URL = os.environ["MODAL_MOTION_URL"]

async def text2motion(prompt: str, duration: float, job_id: str, webhook_url: str) -> dict:
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(MODAL_TEXT2MOTION_URL, json={
            "prompt": prompt,
            "duration": duration,
            "num_denoising_steps": 150,
            "job_id": job_id,
            "webhook_url": webhook_url,
        })
        return resp.json()

async def motion(video_key: str, job_id: str, webhook_url: str) -> dict:
    async with httpx.AsyncClient(timeout=300) as client:
        resp = await client.post(MODAL_MOTION_URL, json={
            "video_key": video_key,
            "job_id": job_id,
            "webhook_url": webhook_url,
            "options": {"fps": 30},
        })
        return resp.json()
```

**Important — tested behavior:**

- **Text2motion** returns directly in ~30-60s. You can `await` the response.
- **Motion capture** takes 60-120s+ and Modal returns a `303` redirect mid-request before the final `200`. Two ways to handle this:
  - **Option A (recommended):** Use the webhook pattern. Don't wait for the response — just fire the request, return `job_id` to frontend, and let Modal call your `/api/webhooks/modal` when done.
  - **Option B:** Use `httpx.AsyncClient(follow_redirects=True, timeout=300)` to wait for the full response. Works but blocks a connection for 2+ minutes.

```python
# Option A: fire-and-forget + webhook (recommended for motion)
async def motion(video_key: str, job_id: str, webhook_url: str) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.post(MODAL_MOTION_URL, json={
                "video_key": video_key,
                "job_id": job_id,
                "webhook_url": webhook_url,
                "options": {"fps": 30},
            })
            return resp.json()
        except httpx.ReadTimeout:
            # Expected — Modal is processing, will call webhook when done
            return {"status": "processing"}
```

---

## R2 Client (r2.py)

```python
import boto3
import os

s3 = boto3.client("s3",
    endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
    aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
    aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
    region_name="auto",
)
BUCKET = os.environ.get("R2_BUCKET_NAME", "buildathon")

def r2_upload(key: str, data: bytes, content_type: str):
    import io
    s3.upload_fileobj(io.BytesIO(data), BUCKET, key, ExtraArgs={"ContentType": content_type})

def r2_presigned_url(key: str, expires: int = 3600) -> str:
    return s3.generate_presigned_url("get_object", Params={"Bucket": BUCKET, "Key": key}, ExpiresIn=expires)
```

---

## Dockerfile

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## requirements.txt

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy==2.0.30
psycopg2-binary==2.9.9
boto3==1.34.0
httpx==0.27.0
python-multipart==0.0.9
pydantic==2.8.0
```

---

## Deploy to Railway

Railway auto-detects Dockerfiles. Just push to `main`:

```bash
git add backend/ && git commit -m "Add FastAPI backend" && git push
```

The GitHub Action deploys via `railway up --service backend`.

Or set Railway to auto-deploy from the repo (Railway dashboard → backend service → Settings → Source → Connect repo).

---

## Priority Order

1. **`main.py` + `db.py`** — FastAPI app, create tables on startup
2. **`POST /api/generate/text2motion`** + `modal_client.py` — the MVP flow
3. **`GET /api/jobs/{id}`** — so frontend can poll
4. **`GET /api/media/{key}`** + `r2.py` — so frontend can download BVH
5. **`POST /api/webhooks/modal`** — for async job completion
6. **`POST /api/generate/motion`** — video upload flow

Get steps 1-4 working first. That's a complete text2motion flow.

---

## Testing Locally

```bash
# Copy env vars to .env, then:
uvicorn main:app --reload --port 8000

# Test text2motion:
curl -X POST http://localhost:8000/api/generate/text2motion \
  -H "Content-Type: application/json" \
  -d '{"prompt": "a person waving", "duration": 3.0}'

# Poll job:
curl http://localhost:8000/api/jobs/<job_id>

# Download result:
curl -L http://localhost:8000/api/media/outputs/<job_id>/animation.bvh -o test.bvh
```
