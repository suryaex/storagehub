"""Chunked + resumable upload orchestration."""
from __future__ import annotations

import math
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants import ACTION_UPLOAD_FILE, RESOURCE_FILE
from app.exceptions.base import NotFound, ValidationError
from app.exceptions.storage import (
    ChecksumMismatch,
    QuotaExceeded,
    UploadSessionInvalid,
)
from app.models.upload_session import UploadSession
from app.repositories.activity_log_repository import ActivityLogRepository
from app.repositories.file_repository import FileRepository
from app.repositories.folder_repository import FolderRepository
from app.repositories.upload_repository import UploadRepository
from app.repositories.user_repository import UserRepository
from app.services.storage_service import storage
from app.utils.checksum import sha256_file
from app.utils.files import sanitize_filename, split_extension


class UploadService:
    def __init__(self, db: Session):
        self.db = db
        self.uploads = UploadRepository(db)
        self.files = FileRepository(db)
        self.folders = FolderRepository(db)
        self.users = UserRepository(db)
        self.logs = ActivityLogRepository(db)

    def create_session(self, user_id: int, data) -> UploadSession:  # noqa: ANN001
        folder = self.folders.get_owned(data.folder_id, user_id)
        if not folder:
            raise NotFound("Target folder not found")
        if data.size_bytes > settings.MAX_UPLOAD_SIZE:
            raise ValidationError("File exceeds the maximum allowed upload size")
        user = self.users.get(user_id)
        if user.used_bytes + data.size_bytes > user.quota_bytes:
            raise QuotaExceeded("Upload would exceed your storage quota")

        chunk_size = data.chunk_size_bytes or settings.UPLOAD_CHUNK_SIZE
        total_chunks = max(1, math.ceil(data.size_bytes / chunk_size))
        session = self.uploads.create_session(
            user_id=user_id, folder_id=folder.id,
            file_name=sanitize_filename(data.file_name),
            original_filename=data.original_filename or data.file_name,
            mime_type=data.mime_type, size_bytes=data.size_bytes,
            total_chunks=total_chunks, uploaded_chunks=0,
            chunk_size_bytes=chunk_size, checksum_sha256=data.checksum_sha256,
            status="pending",
        )
        self.db.commit()
        return session

    def get_session(self, session_id: int, user_id: int) -> UploadSession:
        session = self.uploads.get_owned_session(session_id, user_id)
        if not session:
            raise UploadSessionInvalid("Upload session not found")
        return session

    def upload_chunk(self, session_id: int, user_id: int, chunk_index: int,
                     data: bytes) -> UploadSession:
        session = self.get_session(session_id, user_id)
        if session.status in ("completed", "aborted"):
            raise UploadSessionInvalid("Session is not accepting chunks")
        if chunk_index < 0 or chunk_index >= session.total_chunks:
            raise ValidationError("Invalid chunk index")

        path = storage.write_chunk(session_id, chunk_index, data)
        existing = self.uploads.get_chunk(session_id, chunk_index)
        if existing:
            existing.status = "uploaded"
            existing.chunk_size_bytes = len(data)
            existing.storage_path = storage.relative(path)
        else:
            self.uploads.create_chunk(
                session_id=session_id, chunk_index=chunk_index,
                chunk_size_bytes=len(data), storage_path=storage.relative(path),
                status="uploaded",
            )
        session.uploaded_chunks = len(self.uploads.uploaded_indexes(session_id))
        session.status = "uploading"
        self.db.commit()
        return session

    def resume(self, session_id: int, user_id: int) -> list[int]:
        session = self.get_session(session_id, user_id)
        uploaded = self.uploads.uploaded_indexes(session_id)
        return [i for i in range(session.total_chunks) if i not in uploaded]

    def complete(self, session_id: int, user_id: int):
        session = self.get_session(session_id, user_id)
        uploaded = self.uploads.uploaded_indexes(session_id)
        if len(uploaded) < session.total_chunks:
            missing = [i for i in range(session.total_chunks) if i not in uploaded]
            raise UploadSessionInvalid(f"Missing chunks: {missing[:20]}")

        user = self.users.get(user_id)
        # reserve file row for id
        record = self.files.create(
            folder_id=session.folder_id, owner_id=user_id,
            filename=session.file_name, original_filename=session.original_filename,
            mime_type=session.mime_type, extension=split_extension(session.file_name),
            size_bytes=session.size_bytes, checksum_sha256="0" * 64,
            storage_path="", storage_disk="local",
        )
        dest = storage.file_path(user_id, record.id, session.file_name)
        storage.merge_chunks(session_id, session.total_chunks, dest)

        checksum = sha256_file(dest)
        if session.checksum_sha256 and session.checksum_sha256 != checksum:
            storage.delete(storage.relative(dest))
            self.db.delete(record)
            session.status = "failed"
            self.db.commit()
            raise ChecksumMismatch("Uploaded file failed checksum verification")

        actual_size = storage.absolute(storage.relative(dest)).stat().st_size
        if user.used_bytes + actual_size > user.quota_bytes:
            storage.delete(storage.relative(dest))
            self.db.delete(record)
            session.status = "failed"
            self.db.commit()
            raise QuotaExceeded("Upload would exceed your storage quota")

        record.size_bytes = actual_size
        record.checksum_sha256 = checksum
        record.storage_path = storage.relative(dest)
        session.checksum_sha256 = checksum
        session.status = "completed"
        session.completed_at = datetime.now(timezone.utc)
        self.users.add_used_bytes(user, actual_size)
        self.logs.create(user_id=user_id, action=ACTION_UPLOAD_FILE,
                         resource_type=RESOURCE_FILE, resource_id=record.id)
        self.db.commit()
        storage.cleanup_session(session_id)
        return record

    def abort(self, session_id: int, user_id: int) -> None:
        session = self.get_session(session_id, user_id)
        session.status = "aborted"
        self.db.commit()
        storage.cleanup_session(session_id)
