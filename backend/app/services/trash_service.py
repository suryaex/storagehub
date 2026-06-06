"""Trash list / restore / permanent delete."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.exceptions.base import NotFound
from app.repositories.file_repository import FileRepository
from app.repositories.folder_repository import FolderRepository
from app.repositories.trash_repository import TrashRepository
from app.services.file_service import FileService
from app.services.folder_service import FolderService


class TrashService:
    def __init__(self, db: Session):
        self.db = db
        self.trash = TrashRepository(db)
        self.files = FileRepository(db)
        self.folders = FolderRepository(db)
        self.file_service = FileService(db)
        self.folder_service = FolderService(db)

    def list(self, user_id: int) -> list[dict]:
        items = self.trash.list_for_user(user_id)
        result = []
        for item in items:
            name = None
            if item.item_type == "file":
                f = self.files.get(item.item_id)
                name = f.filename if f else None
            else:
                folder = self.folders.get(item.item_id)
                name = folder.name if folder else None
            result.append({
                "id": item.id, "item_type": item.item_type, "item_id": item.item_id,
                "name": name, "original_path": item.original_path,
                "deleted_at": item.deleted_at, "expires_at": item.expires_at,
            })
        return result

    def restore(self, trash_id: int, user_id: int) -> None:
        item = self.trash.get_owned(trash_id, user_id)
        if not item:
            raise NotFound("Trash item not found")
        if item.item_type == "file":
            self.file_service.restore(item.item_id, user_id)
        else:
            self.folder_service.restore(item.item_id, user_id)

    def permanent_delete(self, trash_id: int, user_id: int) -> None:
        item = self.trash.get_owned(trash_id, user_id)
        if not item:
            raise NotFound("Trash item not found")
        if item.item_type == "file":
            self.file_service.permanent_delete(item.item_id, user_id)
        else:
            folder = self.folders.get_owned(item.item_id, user_id)
            if folder:
                self.db.delete(folder)
        self.trash.delete(item)
        self.db.commit()
