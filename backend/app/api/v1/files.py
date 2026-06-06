from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from fastapi.responses import FileResponse as FastAPIFileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.constants import ACTION_DOWNLOAD_FILE, RESOURCE_FILE
from app.db.session import get_db
from app.models.user import User
from app.repositories.activity_log_repository import ActivityLogRepository
from app.schemas.file import FileMove, FileCopy, FileRename, FileResponse
from app.services.file_service import FileService
from app.utils.response import paginated, success

router = APIRouter()


def _ser(f) -> dict:
    return FileResponse.model_validate(f).model_dump(mode="json")


@router.get("")
def list_files(folder_id: int | None = None, page: int = Query(1, ge=1),
               limit: int = Query(20, ge=1, le=200), search: str | None = None,
               extension: str | None = None, db: Session = Depends(get_db),
               user: User = Depends(get_current_user)):
    items, total = FileService(db).list(user.id, folder_id, page, limit, search, extension)
    return success(paginated([_ser(f) for f in items], page, limit, total))


@router.post("/upload")
def simple_upload(folder_id: int = Form(...), file: UploadFile = File(...),
                  db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    record = FileService(db).simple_upload(user.id, folder_id, file)
    return success(_ser(record), "File uploaded")


@router.get("/{file_id}")
def file_detail(file_id: int, db: Session = Depends(get_db),
                user: User = Depends(get_current_user)):
    return success(_ser(FileService(db).get_owned(file_id, user.id)))


@router.get("/{file_id}/download")
def download_file(file_id: int, db: Session = Depends(get_db),
                  user: User = Depends(get_current_user)):
    f, path = FileService(db).download_path(file_id, user.id)
    ActivityLogRepository(db).create(user_id=user.id, action=ACTION_DOWNLOAD_FILE,
                                     resource_type=RESOURCE_FILE, resource_id=f.id)
    db.commit()
    return FastAPIFileResponse(path, filename=f.filename, media_type=f.mime_type)


@router.put("/{file_id}")
def rename_file(file_id: int, payload: FileRename, db: Session = Depends(get_db),
                user: User = Depends(get_current_user)):
    return success(_ser(FileService(db).rename(file_id, user.id, payload.filename)), "File renamed")


@router.post("/{file_id}/move")
def move_file(file_id: int, payload: FileMove, db: Session = Depends(get_db),
              user: User = Depends(get_current_user)):
    return success(_ser(FileService(db).move(file_id, user.id, payload.folder_id)), "File moved")


@router.post("/{file_id}/copy")
def copy_file(file_id: int, payload: FileCopy, db: Session = Depends(get_db),
              user: User = Depends(get_current_user)):
    return success(_ser(FileService(db).copy(file_id, user.id, payload.folder_id)), "File copied")


@router.delete("/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db),
                user: User = Depends(get_current_user)):
    FileService(db).delete(file_id, user.id)
    return success(None, "File moved to trash")


@router.post("/{file_id}/restore")
def restore_file(file_id: int, db: Session = Depends(get_db),
                 user: User = Depends(get_current_user)):
    return success(_ser(FileService(db).restore(file_id, user.id)), "File restored")


@router.delete("/{file_id}/permanent")
def permanent_delete_file(file_id: int, db: Session = Depends(get_db),
                          user: User = Depends(get_current_user)):
    FileService(db).permanent_delete(file_id, user.id)
    return success(None, "File permanently deleted")
