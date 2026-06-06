from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.file import FileResponse
from app.schemas.folder import FolderCreate, FolderMove, FolderRename, FolderResponse
from app.services.folder_service import FolderService
from app.utils.response import success

router = APIRouter()


def _f(folder) -> dict:
    return FolderResponse.model_validate(folder).model_dump(mode="json")


@router.get("/root/contents")
def root_contents(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    data = FolderService(db).contents(None, user.id)
    return success({
        "folder": _f(data["folder"]),
        "subfolders": [_f(s) for s in data["subfolders"]],
        "files": [FileResponse.model_validate(x).model_dump(mode="json") for x in data["files"]],
    })


@router.get("/{folder_id}/contents")
def folder_contents(folder_id: int, db: Session = Depends(get_db),
                    user: User = Depends(get_current_user)):
    data = FolderService(db).contents(folder_id, user.id)
    return success({
        "folder": _f(data["folder"]),
        "subfolders": [_f(s) for s in data["subfolders"]],
        "files": [FileResponse.model_validate(x).model_dump(mode="json") for x in data["files"]],
    })


@router.post("")
def create_folder(payload: FolderCreate, db: Session = Depends(get_db),
                  user: User = Depends(get_current_user)):
    folder = FolderService(db).create(user.id, payload.parent_id, payload.name)
    return success(_f(folder), "Folder created")


@router.get("/{folder_id}")
def folder_detail(folder_id: int, db: Session = Depends(get_db),
                  user: User = Depends(get_current_user)):
    return success(_f(FolderService(db).get_owned(folder_id, user.id)))


@router.put("/{folder_id}")
def rename_folder(folder_id: int, payload: FolderRename, db: Session = Depends(get_db),
                  user: User = Depends(get_current_user)):
    return success(_f(FolderService(db).rename(folder_id, user.id, payload.name)), "Folder renamed")


@router.post("/{folder_id}/move")
def move_folder(folder_id: int, payload: FolderMove, db: Session = Depends(get_db),
                user: User = Depends(get_current_user)):
    return success(_f(FolderService(db).move(folder_id, user.id, payload.parent_id)), "Folder moved")


@router.delete("/{folder_id}")
def delete_folder(folder_id: int, db: Session = Depends(get_db),
                  user: User = Depends(get_current_user)):
    FolderService(db).delete(folder_id, user.id)
    return success(None, "Folder moved to trash")


@router.post("/{folder_id}/restore")
def restore_folder(folder_id: int, db: Session = Depends(get_db),
                   user: User = Depends(get_current_user)):
    return success(_f(FolderService(db).restore(folder_id, user.id)), "Folder restored")
