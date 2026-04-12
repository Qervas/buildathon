from sqlalchemy import Column, String, DateTime, JSON, func, create_engine
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import sessionmaker, declarative_base
import uuid
import os

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./local.db") # Fallback to sqlite for easy local testing if postgres isn't up
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

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

# Helper to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
