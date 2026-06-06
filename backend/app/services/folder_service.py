"""Folder management business logic."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.constants import ACTION_CREATE_FOLDER, ACTION_DELETE_FOLDER, RESOURCE_FOLDER
from app.exceptions.base import Conflict, NotFound, ValidationError
from app.exceptions.storage import FolderNotFound
from app.models.folder import Folder
from app.repositories.activity_log_repository import ActivityLogRepository
from app.repositories.file_repository import FileRepository
from app.repositories.folder_repository import FolderRepository
from app.repositories.trash_repository import TrashRepository
from app.utils.files import sanitize_filename


class FolderService:
    def __init__(self, db: Session):
        self.db = db
        self.folders = FolderRepository(db)
        self.files = FileRepository(db)
        self.trash = TrashRepository(db)
        self.logs = ActivityLogRepository(db)

    def get_root(self, user_id: int) -> Folder:
        root = self.folders.get_root(user_id)
        if not root:
            root = self.folders.create(owner_id=user_id, parent_id=None, name="root", path="/")
            self.db.commit()
        return root

    def get_owned(self, folder_id: int, user_id: int) -> Folder:
        folder = self.folders.get_owned(folder_id, user_id)
        if not folder:
            raise FolderNotFound("Folder not found")
        return folder

    def contents(self, folder_id: int | None, user_id: int) -> dict:
        if folder_id is None:
            folder = self.get_root(user_id)
        else:
            folder = self.get_owned(folder_id, user_id)
        subfolders = self.folders.list_children(user_id, folder.id)
        files = self.files.list_in_folder(user_id, folder.id)
        return {"folder": folder, "subfolders": subfolders, "files": files}

    def create(self, user_id: int, parent_id: int | None, name: str) -> Folder:
        name = sanitize_filename(name)
        if not name:
            raise ValidationError("Folder name is required")
        if parent_id is None:
            parent = self.get_root(user_id)
            parent_id = parent.id
        else:
            parent = self.get_owned(parent_id, user_id)
        if self.folders.get_by_name(user_id, parent_id, name):
            raise Conflict("A folder with this name already exists here")
        path = (parent.path.rstrip("/") + "/" + name) if parent.path != "/" else "/" + name
        folder = self.folders.create(owner_id=user_id, parent_id=parent_id, name=name, path=path)
        self.logs.create(user_id=user_id, action=ACTION_CREATE_FOLDER,
                         resource_type=RESOURCE_FOLDER, resource_id=folder.id)
        self.db.commit()
        return folder

    def rename(self, folder_id: int, user_id: int, name: str) -> Folder:
        folder = self.get_owned(folder_id, user_id)
        name = sanitize_filename(name)
        existing = self.folders.get_by_name(user_id, folder.parent_id, name)
        if existing and existing.id != folder.id:
            raise Conflict("A folder with this name already exists here")
        folder.name = name
        self.db.commit()
        return folder

    def move(self, folder_id: int, user_id: int, new_parent_id: int | None) -> Folder:
        folder = self.get_owned(folder_id, user_id)
        if new_parent_id == folder.id:
            raise ValidationError("Cannot move a folder into itself")
        if new_parent_id is None:
            new_parent = self.get_root(user_id)
        else:
            new_parent = self.get_owned(new_parent_id, user_id)
        folder.parent_id = new_parent.id
        folder.path = (new_parent.path.rstrip("/") + "/" + folder.name)
        self.db.commit()
        return folder

    def delete(self, folder_id: int, user_id: int) -> None:
        folder = self.get_owned(folder_id, user_id)
        if folder.parent_id is None:
            raise ValidationError("Cannot delete the root folder")
        now = datetime.now(timezone.utc)
        folder.is_deleted = True
        folder.deleted_at = now
        self.trash.create(user_id=user_id, item_type="folder", item_id=folder.id,
                          original_path=folder.path)
        self.logs.create(user_id=user_id, action=ACTION_DELETE_FOLDER,
                         resource_type=RESOURCE_FOLDER, resource_id=folder.id)
        self.db.commit()

    def restore(self, folder_id: int, user_id: int) -> Folder:
        folder = self.folders.get_owned(folder_id, user_id)
        if not folder:
            raise NotFound("Folder not found")
        folder.is_deleted = False
        folder.deleted_at = None
        item = self.trash.find(user_id, "folder", folder.id)
        if item:
            item.restored_at = datetime.now(timezone.utc)
        self.db.commit()
        return folder
