from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db import get_db, ChatSession, ChatMessage, Job
from pydantic import BaseModel
from uuid import UUID
from typing import Optional

router = APIRouter()


@router.get("/api/sessions")
def list_sessions(db: Session = Depends(get_db)):
    """Public gallery — all visible chat sessions with their messages and jobs."""
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.visible == True)
        .order_by(ChatSession.updated_at.desc())
        .limit(50)
        .all()
    )
    result = []
    for s in sessions:
        msgs = []
        for m in s.messages:
            msg = {
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            if m.job_id:
                job = db.query(Job).filter(Job.id == m.job_id).first()
                if job:
                    msg["job"] = {
                        "id": str(job.id),
                        "type": job.type,
                        "status": job.status,
                        "result_url": f"/api/media/{job.result_key}" if job.result_key else None,
                        "meta": job.result_meta,
                    }
            msgs.append(msg)

        result.append({
            "id": str(s.id),
            "title": s.title,
            "source": s.source or "web",
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None,
            "message_count": len(msgs),
            "messages": msgs,
        })
    return result


@router.get("/api/sessions/{session_id}")
def get_session(session_id: UUID, db: Session = Depends(get_db)):
    """Load a single session with all messages and jobs."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        return {"error": "Session not found"}

    msgs = []
    for m in session.messages:
        msg = {
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "job_id": str(m.job_id) if m.job_id else None,
        }
        if m.job_id:
            job = db.query(Job).filter(Job.id == m.job_id).first()
            if job:
                msg["job"] = {
                    "id": str(job.id),
                    "type": job.type,
                    "status": job.status,
                    "result_url": f"/api/media/{job.result_key}" if job.result_key else None,
                    "meta": job.result_meta,
                }
        msgs.append(msg)

    return {
        "id": str(session.id),
        "title": session.title,
        "source": session.source or "web",
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "messages": msgs,
    }


class SessionCreate(BaseModel):
    source: str = "web"  # web, mcp, blender, api


@router.post("/api/sessions")
def create_session(req: SessionCreate = SessionCreate(), db: Session = Depends(get_db)):
    """Create a new chat session."""
    session = ChatSession(source=req.source)
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"id": str(session.id)}


class MessageCreate(BaseModel):
    session_id: UUID
    role: str
    content: str
    job_id: Optional[UUID] = None


@router.post("/api/sessions/message")
def add_message(req: MessageCreate, db: Session = Depends(get_db)):
    """Save a message to a session."""
    session = db.query(ChatSession).filter(ChatSession.id == req.session_id).first()
    if not session:
        return {"error": "Session not found"}, 404

    msg = ChatMessage(
        session_id=req.session_id,
        role=req.role,
        content=req.content,
        job_id=req.job_id,
    )
    db.add(msg)

    # Auto-title from first user message
    if req.role == "user" and session.title == "Untitled":
        session.title = req.content[:100]

    db.commit()
    return {"ok": True}


@router.patch("/api/sessions/{session_id}/hide")
def hide_session(session_id: UUID, db: Session = Depends(get_db)):
    """Hide a session from the public gallery."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        return {"error": "Session not found"}, 404
    session.visible = False
    db.commit()
    return {"ok": True}


@router.patch("/api/sessions/{session_id}/show")
def show_session(session_id: UUID, db: Session = Depends(get_db)):
    """Show a hidden session in the public gallery."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        return {"error": "Session not found"}, 404
    session.visible = True
    db.commit()
    return {"ok": True}
