from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db, Job
import os
from datetime import datetime

router = APIRouter()
WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET")

@router.post("/api/webhooks/modal")
async def modal_webhook(token: str, payload: dict, db: Session = Depends(get_db)):
    if token != WEBHOOK_SECRET:
        raise HTTPException(403, "Invalid token")

    job_id = payload.get("job_id")
    if not job_id:
        raise HTTPException(400, "Missing job_id")
        
    job = db.query(Job).get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")

    if payload.get("status") == "completed":
        job.status = "completed"
        job.result_key = payload.get("output_key")
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
