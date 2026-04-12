# Buildathon Implementation Plan — Animation Generation Platform

> **Date:** 2026-04-12 (LiU National Startup Buildathon)
> **Team:** 3 people, 1 day
> **Based on:** niua.ohao.tech animation pipeline (adapted for hackathon)

---

## What We're Building

An **AI animation generation platform** — users can:
1. **Text → Motion** — Type a prompt ("person walking confidently"), get a skeletal animation (BVH)
2. **Video → Motion Capture** — Upload a video, extract skeletal motion data (BVH)
3. **Preview in browser** — 3D skeleton animation viewer with playback controls

This is a simplified, focused version of [niua.ohao.tech](https://niua.ohao.tech) — we're taking the animation pipeline and building a clean standalone product in 1 day.

---

## Architecture

```
┌──────────────────────┐     ┌─────────────────────────────┐     ┌─────────────────────┐
│   Cloudflare Pages   │     │      Railway (FastAPI)       │     │     Modal.com        │
│   (Frontend)         │────▶│      + PostgreSQL            │────▶│     (GPU Inference)  │
│                      │     │                              │     │                      │
│  React + Three.js    │     │  /api/generate/text2motion   │     │  Kimodo (text→BVH)   │
│  BVH Viewer          │◀────│  /api/generate/motion        │◀────│  GEM-X  (video→BVH)  │
│  Upload UI           │     │  /api/jobs/{id}              │     │                      │
│                      │     │  /api/media/{key}            │     │  Cloudflare R2       │
└──────────────────────┘     └─────────────────────────────┘     │  (asset storage)     │
                                                                  └─────────────────────┘
```

### Stack

| Layer | Tech | Why |
|-------|------|-----|
| **Frontend** | React + Vite + Three.js + Tailwind | Fast to build, Three.js for BVH viewer |
| **Backend** | FastAPI (Python) on Railway | Python = fast to write, FastAPI = async + auto-docs |
| **Database** | PostgreSQL on Railway | Job tracking, asset metadata |
| **Inference** | Modal.com (serverless GPU) | A10G GPUs on-demand, no infra management |
| **Storage** | Cloudflare R2 | S3-compatible, cheap, already have CF account |
| **Deploy** | GitHub Actions → CF Pages + Railway | Already wired up from pre-event setup |

---

## Task Distribution

### Person 1: Frontend (Cloudflare Pages)
**Goal:** Build the UI — input forms, BVH viewer, job status

**Files to create:**
```
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── TextToMotion.tsx      # Prompt input form
│   │   ├── VideoUpload.tsx       # Video upload + preview
│   │   ├── BVHViewer.tsx         # 3D animation viewer (THREE.js)
│   │   ├── JobStatus.tsx         # Loading/progress indicator
│   │   └── ResultCard.tsx        # Download links + preview
│   ├── hooks/
│   │   └── useApi.ts             # API client hooks
│   └── styles/
│       └── globals.css
```

**Key Component: BVHViewer**
This is the showpiece. Port from niua (`~/Desktop/Github/niua/frontend/src/components/common/BVHViewer.tsx`). Core logic:

```tsx
// Uses THREE.js BVHLoader
import { BVHLoader } from 'three/examples/jsm/loaders/BVHLoader.js';

// Key features to keep:
// - Load BVH from URL
// - Play/pause/scrub animation
// - SkeletonHelper for bone visualization
// - Grid + basic lighting
// - Frame counter display

// Can simplify: remove multi-person, Y-rotation, End Site pruning
// (those are nice-to-haves, not needed for demo)
```

**API calls the frontend makes:**
```
POST /api/generate/text2motion   { prompt, duration }        → { job_id }
POST /api/generate/motion        { video as multipart }      → { job_id }
GET  /api/jobs/{job_id}          (poll for status)           → { status, result_url }
GET  /api/media/{key}            (download BVH/asset)        → binary file
```

**Priority order:**
1. Text-to-motion form + submit → show result (MVP)
2. BVH viewer with play/pause
3. Video upload for motion capture
4. Polish: loading states, error handling, download buttons

---

### Person 2: Backend (Railway + FastAPI)
**Goal:** API server that receives requests, calls Modal, tracks jobs, serves assets

**Files to create:**
```
backend/
├── requirements.txt
├── Dockerfile
├── main.py                # FastAPI app
├── routes/
│   ├── generate.py        # /api/generate/* endpoints
│   ├── jobs.py            # /api/jobs/* endpoints
│   ├── media.py           # /api/media/* endpoints
│   └── webhooks.py        # /api/webhooks/modal endpoint
├── services/
│   ├── modal_client.py    # HTTP client to call Modal endpoints
│   └── r2_client.py       # Cloudflare R2 upload/download
├── models/
│   └── schemas.py         # Pydantic models
├── db/
│   ├── database.py        # SQLAlchemy setup
│   └── models.py          # Job table
└── config.py              # Environment variables
```

**Database Schema (PostgreSQL):**
```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL,          -- 'text2motion' or 'motion'
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    input_params JSONB NOT NULL,         -- { prompt, duration } or { video_key }
    result_key TEXT,                      -- R2 key for output BVH
    result_meta JSONB,                   -- { frames, fps, duration }
    error TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

**Key Endpoints:**

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Buildathon Animation API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# routes/generate.py
@router.post("/api/generate/text2motion")
async def text2motion(prompt: str, duration: float = 5.0):
    """
    1. Create job in DB (status=pending)
    2. POST to Modal text2motion endpoint:
       { prompt, duration, webhook_url, webhook_token }
    3. Return { job_id }
    """

@router.post("/api/generate/motion")
async def motion_capture(video: UploadFile):
    """
    1. Upload video to R2
    2. Create job in DB (status=pending)
    3. POST to Modal motion endpoint:
       { input_key: r2_key, webhook_url, webhook_token }
    4. Return { job_id }
    """

# routes/webhooks.py
@router.post("/api/webhooks/modal")
async def modal_webhook(token: str, payload: dict):
    """
    Modal calls this when GPU job finishes.
    1. Verify token
    2. Update job in DB (status=completed, result_key=...)
    """

# routes/jobs.py
@router.get("/api/jobs/{job_id}")
async def get_job(job_id: UUID):
    """
    Frontend polls this. Returns:
    { id, status, result_url (if completed), error (if failed) }
    """

# routes/media.py
@router.get("/api/media/{key:path}")
async def get_media(key: str):
    """
    Generate R2 presigned URL and redirect.
    """
```

**R2 Client (services/r2_client.py):**
```python
import boto3

# R2 is S3-compatible
s3 = boto3.client('s3',
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
)

def upload_file(key, data, content_type):
    s3.put_object(Bucket=BUCKET, Key=key, Body=data, ContentType=content_type)

def get_presigned_url(key, expires=3600):
    return s3.generate_presigned_url('get_object', Params={'Bucket': BUCKET, 'Key': key}, ExpiresIn=expires)
```

**Modal Client (services/modal_client.py):**
```python
import httpx

async def call_text2motion(prompt: str, duration: float, webhook_url: str, webhook_token: str):
    async with httpx.AsyncClient() as client:
        resp = await client.post(MODAL_TEXT2MOTION_URL, json={
            "prompt": prompt,
            "duration": duration,
            "webhook_url": webhook_url,
            "webhook_token": webhook_token,
        }, timeout=120)
        return resp.json()

async def call_motion(input_key: str, webhook_url: str, webhook_token: str):
    async with httpx.AsyncClient() as client:
        resp = await client.post(MODAL_MOTION_URL, json={
            "input_key": input_key,
            "webhook_url": webhook_url,
            "webhook_token": webhook_token,
        }, timeout=120)
        return resp.json()
```

**Environment Variables (set in Railway):**
```
DATABASE_URL=postgresql://...          # Railway auto-provides this
MODAL_TEXT2MOTION_URL=https://...      # From Modal deploy
MODAL_MOTION_URL=https://...           # From Modal deploy
R2_ACCOUNT_ID=33c7a387dae5a6c71638127a90f83e08
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=buildathon
WEBHOOK_SECRET=<random-string>         # Verify Modal callbacks
FRONTEND_URL=https://buildathon-bii.pages.dev
```

**Dockerfile:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**requirements.txt:**
```
fastapi==0.115.0
uvicorn==0.30.0
sqlalchemy==2.0.30
asyncpg==0.29.0
psycopg2-binary==2.9.9
boto3==1.34.0
httpx==0.27.0
python-multipart==0.0.9
pydantic==2.8.0
```

**Priority order:**
1. FastAPI + text2motion endpoint + Modal client (MVP)
2. Job tracking (DB + polling endpoint)
3. R2 integration (upload/download)
4. Video upload + motion capture endpoint
5. Webhook handler for async jobs

---

### Person 3 (Frank): Modal Services + Integration
**Goal:** Deploy the GPU inference services on Modal, wire everything together

**The Modal services already exist in niua.** Port these files:
```
# FROM niua (~/Desktop/Github/niua/modal/)
modal/
├── services/
│   ├── text2motion.py     # Kimodo — text prompt → BVH (PORT THIS FIRST)
│   └── motion.py          # GEM-X — video → BVH (PORT THIS SECOND)
├── core/
│   └── base.py            # BaseService (R2 upload, webhooks, error handling)
└── shared_r2.py           # R2 upload utility
```

**What to adapt for buildathon:**
1. Change R2 bucket name and credentials
2. Update webhook URLs to point at Railway backend
3. Simplify — remove niua-specific workspace logic
4. Deploy to Modal under buildathon project

**Deploy commands:**
```bash
modal deploy modal/services/text2motion.py
modal deploy modal/services/motion.py
```

**After deploying, grab the Modal endpoint URLs and set them in Railway env vars.**

**Also handle:**
- Create Cloudflare R2 bucket for buildathon
- Wire up CI/CD (update deploy.yml for frontend build + backend deploy)
- Integration testing between all 3 layers
- Demo preparation

---

## Models Reference

| Service | Model | License | Input → Output | GPU | Time |
|---------|-------|---------|----------------|-----|------|
| **Text-to-Motion** | Kimodo-SOMA-RP-v1.1 (NVIDIA) | NVIDIA Open Model | Text prompt → BVH (77-joint, 30fps) | A10G | ~30-60s |
| **Motion Capture** | GEM-X + SOMA (NVIDIA) | Apache 2.0 | Video (MP4) → BVH (78-joint) | A10G | ~60-120s |

**BVH Format Notes:**
- SOMA skeleton: 77-78 joints
- Kimodo outputs 2 ROOT entries — must strip first (reference root) before frontend can display
- See `_strip_reference_root()` in niua's `text2motion.py` lines 242-295
- FPS: typically 30fps
- Duration: 1-10 seconds for text2motion, video length for mocap (max 30s)

---

## Data Flow

```
TEXT-TO-MOTION:
User types prompt → Frontend POST /api/generate/text2motion
    → Backend creates job, calls Modal
    → Modal runs Kimodo on A10G GPU (~30-60s)
    → Modal uploads BVH to R2
    → Modal calls webhook → Backend updates job status
    → Frontend polls /api/jobs/{id}, sees "completed"
    → Frontend fetches BVH from /api/media/{key}
    → BVHViewer renders 3D skeleton animation

MOTION CAPTURE:
User uploads video → Frontend POST /api/generate/motion (multipart)
    → Backend uploads video to R2, creates job, calls Modal
    → Modal downloads video, runs GEM-X (~60-120s)
    → Modal uploads BVH to R2
    → Modal calls webhook → Backend updates job status
    → Frontend polls, fetches, renders (same as above)
```

---

## Timeline (Suggested)

| Time | Person 1 (Frontend) | Person 2 (Backend) | Person 3 (Frank) |
|------|--------------------|--------------------|-------------------|
| **09:00-10:00** | Scaffold React + Vite + Tailwind | Scaffold FastAPI + DB | Port Modal services, deploy |
| **10:00-12:00** | Text-to-motion form + API integration | /generate/text2motion + Modal client | R2 bucket, env vars, integration |
| **12:00-13:00** | *Lunch* | *Lunch* | *Lunch* |
| **13:00-15:00** | BVH Viewer (Three.js) | Job polling + webhook handler | Video upload + motion capture flow |
| **15:00-17:00** | Video upload UI + polish | R2 media serving + motion endpoint | End-to-end testing + demo prep |
| **17:00-18:00** | Final polish, loading states | Error handling, CORS fixes | Pitch deck, demo script |

---

## Key Decisions Made

1. **FastAPI instead of Rust** — Faster to write in a hackathon. niua uses Rust for production performance, but Python is fine for a demo.
2. **Polling instead of SSE** — Simpler. Frontend polls `/api/jobs/{id}` every 2 seconds. SSE is better UX but more to build.
3. **R2 for storage** — Same as niua. All generated assets go to R2, backend serves presigned URLs.
4. **Webhook for async jobs** — Modal calls back when GPU work is done. Backend updates DB. Frontend picks it up on next poll.
5. **No auth for demo** — Skip Supabase/JWT. Open access. Add auth post-hackathon.
6. **No billing** — Skip Stripe. This is a demo.

---

## Environment Setup Checklist

Before hackathon day, each person should have:

- [ ] **All:** Node.js 20+, Python 3.11+, Git access to Qervas/buildathon
- [ ] **Person 1:** `npm create vite@latest`, familiar with Three.js BVHLoader
- [ ] **Person 2:** `pip install fastapi uvicorn sqlalchemy`, familiar with Railway deploy
- [ ] **Person 3 (Frank):** Modal CLI installed (`pip install modal`), `modal token set`, R2 credentials ready
- [ ] **All:** Read this doc, know your API contracts

---

## API Contract (Frontend ↔ Backend)

```typescript
// POST /api/generate/text2motion
// Request:
{ "prompt": "person walking forward confidently", "duration": 5.0 }
// Response:
{ "job_id": "uuid-here" }

// POST /api/generate/motion
// Request: multipart/form-data with "video" file
// Response:
{ "job_id": "uuid-here" }

// GET /api/jobs/{job_id}
// Response (pending):
{ "id": "uuid", "status": "processing", "type": "text2motion" }
// Response (completed):
{ "id": "uuid", "status": "completed", "type": "text2motion",
  "result_url": "/api/media/outputs/abc/animation.bvh",
  "meta": { "frames": 150, "fps": 30, "duration": 5.0 } }
// Response (failed):
{ "id": "uuid", "status": "failed", "error": "GPU timeout" }

// GET /api/media/{key}
// Response: 302 redirect to R2 presigned URL
```

---

## Reference: niua Files to Port

| What | niua path | Adapt for |
|------|-----------|-----------|
| Text-to-motion inference | `~/Desktop/Github/niua/modal/services/text2motion.py` | Change R2 creds, webhook URL |
| Motion capture inference | `~/Desktop/Github/niua/modal/services/motion.py` | Change R2 creds, webhook URL |
| Base service (R2 + webhooks) | `~/Desktop/Github/niua/modal/core/base.py` | Change R2 bucket to buildathon |
| BVH viewer component | `~/Desktop/Github/niua/frontend/src/components/common/BVHViewer.tsx` | Simplify, remove multi-person |
| R2 upload utility | `~/Desktop/Github/niua/modal/shared_r2.py` | Update credentials |
