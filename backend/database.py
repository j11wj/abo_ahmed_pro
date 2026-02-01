from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base
import os

# مسار قاعدة البيانات
DATABASE_URL = "sqlite:///./real_estate.db"

# إنشاء محرك قاعدة البيانات
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # مطلوب لـ SQLite
)

# إنشاء SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """إنشاء جميع الجداول"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """الحصول على جلسة قاعدة البيانات"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

