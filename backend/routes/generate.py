from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from db import get_db, Job
import modal_client
from r2 import r2_upload
import os
from uuid import uuid4
from datetime import datetime

router = APIRouter()

class TextToMotionRequest(BaseModel):
    prompt: str
    duration: float

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET")

@router.post("/api/generate/text2motion")
async def text2motion(request: TextToMotionRequest, db: Session = Depends(get_db)):
    job = Job(type="text2motion", status="processing", input_params=request.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)

    webhook_url = f"{BACKEND_URL}/api/webhooks/modal?token={WEBHOOK_SECRET}"
    result = await modal_client.text2motion(
        prompt=request.prompt,
        duration=request.duration,
        job_id=str(job.id),
        webhook_url=webhook_url,
    )

    if "output_key" in result and "error" not in result:
        job.status = "completed"
        job.result_key = result["output_key"]
        job.result_meta = {"frames": result.get("frames"), "fps": result.get("fps")}
        job.completed_at = datetime.utcnow()
        db.commit()

    return {"job_id": str(job.id)}

@router.post("/api/generate/motion")
async def motion_capture(video: UploadFile = File(...), db: Session = Depends(get_db)):
    video_bytes = await video.read()
    video_key = f"uploads/{uuid4()}/{video.filename}"
    r2_upload(video_key, video_bytes, video.content_type or "video/mp4")

    job = Job(type="motion", status="processing", input_params={"video_key": video_key})
    db.add(job)
    db.commit()
    db.refresh(job)

    webhook_url = f"{BACKEND_URL}/api/webhooks/modal?token={WEBHOOK_SECRET}"
    await modal_client.motion(
        video_key=video_key,
        job_id=str(job.id),
        webhook_url=webhook_url,
    )

    return {"job_id": str(job.id)}
