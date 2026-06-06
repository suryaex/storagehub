"""File metadata + simple upload/download business logic."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants import (
    ACTION_DELETE_FILE,
    ACTION_UPLOAD_FILE,
    RESOURCE_FILE,
)
from app.exceptions.base import NotFound, ValidationError
from app.exceptions.storage import FileNotFound, QuotaExceeded
from app.models.file import File
from app.repositories.activity_log_repository import ActivityLogRepository
from app.repositories.file_repository import FileRepository
from app.repositories.folder_repository import FolderRepository
from app.repositories.trash_repository import TrashRepository
from app.repositories.user_repository import UserRepository
from app.services.storage_service import storage
from app.utils.checksum import sha256_file
from app.utils.files import sanitize_filename, split_extension


class FileService:
    def __init__(self, db: Session):
        self.db = db
        self.files = FileRepository(db)
        self.folders = FolderRepository(db)
        self.users = UserRepository(db)
        self.trash = TrashRepository(db)
        self.logs = ActivityLogRepository(db)

    def get_owned(self, file_id: int, user_id: int) -> File:
        f = self.files.get_owned(file_id, user_id)
        if not f or f.is_deleted:
            raise FileNotFound("File not found")
        return f

    def list(self, user_id: int, folder_id: int | None, page: int, limit: int,
             search: str | None, extension: str | None):
        return self.files.list(user_id, folder_id, page, limit, search, extension)

    def simple_upload(self, user_id: int, folder_id: int, upload_file) -> File:  # noqa: ANN001
        folder = self.folders.get_owned(folder_id, user_id)
        if not folder:
            raise NotFound("Target folder not found")
        user = self.users.get(user_id)

        filename = sanitize_filename(upload_file.filename or "untitled")
        # reserve a row to get an id for the storage path
        record = self.files.create(
            folder_id=folder.id, owner_id=user_id, filename=filename,
            original_filename=upload_file.filename or filename,
            mime_type=upload_file.content_type or "application/octet-stream",
            extension=split_extension(filename), size_bytes=0,
            checksum_sha256="0" * 64, storage_path="", storage_disk="local",
        )
        dest = storage.file_path(user_id, record.id, filename)
        size = storage.save_stream(dest, upload_file.file)

        if user.used_bytes + size > user.quota_bytes:
            storage.delete(storage.relative(dest))
            self.db.delete(record)
            self.db.commit()
            raise QuotaExceeded("Upload would exceed your storage quota")

        record.size_bytes = size
        record.checksum_sha256 = sha256_file(dest)
        record.storage_path = storage.relative(dest)
        self.users.add_used_bytes(user, size)
        self.logs.create(user_id=user_id, action=ACTION_UPLOAD_FILE,
                         resource_type=RESOURCE_FILE, resource_id=record.id)
        self.db.commit()
        return record

    def rename(self, file_id: int, user_id: int, filename: str) -> File:
        f = self.get_owned(file_id, user_id)
        f.filename = sanitize_filename(filename)
        f.extension = split_extension(f.filename)
        self.db.commit()
        return f

    def move(self, file_id: int, user_id: int, folder_id: int) -> File:
        f = self.get_owned(file_id, user_id)
        folder = self.folders.get_owned(folder_id, user_id)
        if not folder:
            raise NotFound("Target folder not found")
        f.folder_id = folder.id
        self.db.commit()
        return f

    def copy(self, file_id: int, user_id: int, folder_id: int) -> File:
        src = self.get_owned(file_id, user_id)
        folder = self.folders.get_owned(folder_id, user_id)
        if not folder:
            raise NotFound("Target folder not found")
        user = self.users.get(user_id)
        if user.used_bytes + src.size_bytes > user.quota_bytes:
            raise QuotaExceeded("Copy would exceed your storage quota")
        copy = self.files.create(
            folder_id=folder.id, owner_id=user_id, filename=src.filename,
            original_filename=src.original_filename, mime_type=src.mime_type,
            extension=src.extension, size_bytes=src.size_bytes,
            checksum_sha256=src.checksum_sha256, storage_path="", storage_disk="local",
        )
        dest = storage.file_path(user_id, copy.id, copy.filename)
        storage.copy(src.storage_path, dest)
        copy.storage_path = storage.relative(dest)
        self.users.add_used_bytes(user, src.size_bytes)
        self.db.commit()
        return copy

    def delete(self, file_id: int, user_id: int) -> None:
        f = self.get_owned(file_id, user_id)
        f.is_deleted = True
        f.deleted_at = datetime.now(timezone.utc)
        self.trash.create(user_id=user_id, item_type="file", item_id=f.id,
                          original_path=f.storage_path)
        self.logs.create(user_id=user_id, action=ACTION_DELETE_FILE,
                         resource_type=RESOURCE_FILE, resource_id=f.id)
        self.db.commit()

    def restore(self, file_id: int, user_id: int) -> File:
        f = self.files.get_owned(file_id, user_id)
        if not f:
            raise NotFound("File not found")
        f.is_deleted = False
        f.deleted_at = None
        item = self.trash.find(user_id, "file", f.id)
        if item:
            item.restored_at = datetime.now(timezone.utc)
        self.db.commit()
        return f

    def permanent_delete(self, file_id: int, user_id: int) -> None:
        f = self.files.get_owned(file_id, user_id)
        if not f:
            raise NotFound("File not found")
        user = self.users.get(user_id)
        if f.storage_path:
            storage.delete(f.storage_path)
        self.users.add_used_bytes(user, -f.size_bytes)
        self.db.delete(f)
        self.db.commit()

    def download_path(self, file_id: int, user_id: int) -> tuple[File, str]:
        f = self.get_owned(file_id, user_id)
        if not storage.exists(f.storage_path):
            raise FileNotFound("Stored file is missing")
        return f, str(storage.absolute(f.storage_path))
