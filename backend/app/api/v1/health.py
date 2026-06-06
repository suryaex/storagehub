from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.services.storage_service import storage
from app.utils.response import success

router = APIRouter()


@router.get("/health")
def health():
    return success({"status": "ok", "service": settings.APP_NAME, "version": settings.APP_VERSION},
                   "Healthy")


@router.get("/ready")
def ready(db: Session = Depends(get_db)):
    db_ok = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False
    storage_ok = storage.root.exists()
    status = "ok" if (db_ok and storage_ok) else "degraded"
    return success({"status": status, "database": db_ok, "storage": storage_ok}, "Readiness")
