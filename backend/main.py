from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv() # Load .env before initializing other modules

from db import engine, Base
from routes import generate, jobs, webhooks, media, chat, sessions

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

# Migrate: add missing columns to existing tables
from sqlalchemy import text, inspect
with engine.connect() as conn:
    inspector = inspect(engine)
    if "chat_sessions" in inspector.get_table_names():
        columns = [c["name"] for c in inspector.get_columns("chat_sessions")]
        if "source" not in columns:
            conn.execute(text("ALTER TABLE chat_sessions ADD COLUMN source VARCHAR(20) DEFAULT 'web'"))
            conn.commit()
    if "jobs" in inspector.get_table_names():
        columns = [c["name"] for c in inspector.get_columns("jobs")]
        if "session_id" not in columns:
            conn.execute(text("ALTER TABLE jobs ADD COLUMN session_id UUID"))
            conn.commit()

app = FastAPI(title="Buildathon API")

# Update CORS for production frontend URL later
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate.router)
app.include_router(jobs.router)
app.include_router(webhooks.router)
app.include_router(media.router)
app.include_router(chat.router)
app.include_router(sessions.router)

@app.get("/")
def read_root():
    return {"status": "Backend is running"}
