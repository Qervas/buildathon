from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv() # Load .env before initializing other modules

from db import engine, Base
from routes import generate, jobs, webhooks, media, chat

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

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

@app.get("/")
def read_root():
    return {"status": "Backend is running"}
