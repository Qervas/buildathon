from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from db import get_db, Job

router = APIRouter()

@router.get("/api/jobs/{job_id}")
async def get_job(job_id: UUID, db: Session = Depends(get_db)):
    job = db.query(Job).get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")

    response = {
        "id": str(job.id),
        "type": job.type,
        "status": job.status,
        "created_at": job.created_at.isoformat() if job.created_at else None,
    }
    if job.status == "completed":
        response["result_url"] = f"/api/media/{job.result_key}"
        response["meta"] = job.result_meta
    if job.status == "failed":
        response["error"] = job.error
    return response
