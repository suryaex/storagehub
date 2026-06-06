from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.file import FileResponse
from app.schemas.upload import UploadSessionCreate
from app.services.upload_service import UploadService
from app.utils.response import success

router = APIRouter()


def _session(s) -> dict:
    return {
        "session_id": s.id, "status": s.status,
        "total_chunks": s.total_chunks, "uploaded_chunks": s.uploaded_chunks,
        "chunk_size_bytes": s.chunk_size_bytes,
    }


@router.post("/sessions")
def create_session(payload: UploadSessionCreate, db: Session = Depends(get_db),
                   user: User = Depends(get_current_user)):
    s = UploadService(db).create_session(user.id, payload)
    return success(_session(s), "Upload session created")


@router.post("/sessions/{session_id}/chunks/{chunk_index}")
async def upload_chunk(session_id: int, chunk_index: int, request: Request,
                       db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    data = await request.body()
    s = UploadService(db).upload_chunk(session_id, user.id, chunk_index, data)
    return success({
        "session_id": s.id, "chunk_index": chunk_index,
        "uploaded_chunks": s.uploaded_chunks, "total_chunks": s.total_chunks,
    }, "Chunk uploaded")


@router.get("/sessions/{session_id}")
def session_status(session_id: int, db: Session = Depends(get_db),
                   user: User = Depends(get_current_user)):
    s = UploadService(db).get_session(session_id, user.id)
    return success(_session(s))


@router.post("/sessions/{session_id}/resume")
def resume_session(session_id: int, db: Session = Depends(get_db),
                   user: User = Depends(get_current_user)):
    missing = UploadService(db).resume(session_id, user.id)
    return success({"missing_chunks": missing}, "Resume info generated")


@router.post("/sessions/{session_id}/complete")
def complete_session(session_id: int, db: Session = Depends(get_db),
                     user: User = Depends(get_current_user)):
    record = UploadService(db).complete(session_id, user.id)
    return success(FileResponse.model_validate(record).model_dump(mode="json"), "Upload completed")


@router.post("/sessions/{session_id}/abort")
def abort_session(session_id: int, db: Session = Depends(get_db),
                  user: User = Depends(get_current_user)):
    UploadService(db).abort(session_id, user.id)
    return success(None, "Upload aborted")
