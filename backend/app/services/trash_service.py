"""Trash list / restore / permanent delete / retention purge."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.exceptions.base import NotFound
from app.models.folder import Folder
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

    def purge_expired(self, user_id: int) -> int:
        """Permanently delete trash items past their retention window.
        ponytail: purge is opportunistic — triggered by listing/restoring
        trash, no cron/daemon. Trash from an account that never revisits
        Trash won't self-purge; add an admin sweep endpoint if that
        matters in practice."""
        now = datetime.now(timezone.utc)
        purged = 0
        for item in self.trash.list_expirable(user_id):
            exp = item.expires_at
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp < now:
                self.permanent_delete(item.id, user_id)
                purged += 1
        return purged

    def list(self, user_id: int) -> list[dict]:
        self.purge_expired(user_id)
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
        # Purge first: if this exact item is past retention it gets deleted
        # here (blob + row), so the get_owned below correctly 404s instead
        # of resurrecting a record whose blob may already be gone.
        self.purge_expired(user_id)
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
                self._purge_folder_tree(folder, user_id)
        self.trash.delete(item)
        self.db.commit()

    def _purge_folder_tree(self, root: Folder, user_id: int) -> None:
        """Delete every file under root (recursively) through the same
        FileService.permanent_delete path used for single-file trash items,
        so blob removal and quota refund stay in one place, then drop the
        now-empty folder rows. Iterative (stack) to avoid deep recursion on
        deep trees. Ownership is enforced by list_children/list_in_folder
        only ever walking folders/files owned by user_id."""
        folders = []
        stack = [root]
        while stack:
            folder = stack.pop()
            folders.append(folder)
            stack.extend(self.folders.list_children(user_id, folder.id, include_deleted=True))
            for f in self.files.list_in_folder(user_id, folder.id, include_deleted=True):
                self.file_service.permanent_delete(f.id, user_id)
        for folder in folders:
            self.db.delete(folder)
