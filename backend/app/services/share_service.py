"""Sharing business logic."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants import ACTION_SHARE_CREATED, ACTION_SHARE_REVOKED, RESOURCE_SHARE
from app.exceptions.base import NotFound
from app.exceptions.storage import ShareDisabled, ShareExpired
from app.models.share import Share
from app.repositories.activity_log_repository import ActivityLogRepository
from app.repositories.file_repository import FileRepository
from app.repositories.folder_repository import FolderRepository
from app.repositories.share_repository import ShareRepository
from app.repositories.user_repository import UserRepository
from app.security.hashes import hash_password, verify_password
from app.security.tokens import generate_share_token


class ShareService:
    def __init__(self, db: Session):
        self.db = db
        self.shares = ShareRepository(db)
        self.files = FileRepository(db)
        self.folders = FolderRepository(db)
        self.users = UserRepository(db)
        self.logs = ActivityLogRepository(db)

    def share_url(self, token: str) -> str:
        return f"{settings.FRONTEND_URL.rstrip('/')}/share/{token}"

    def create(self, user_id: int, data) -> Share:  # noqa: ANN001
        if data.file_id:
            target = self.files.get_owned(data.file_id, user_id)
            if not target:
                raise NotFound("File not found")
            target.is_shared = True
        else:
            target = self.folders.get_owned(data.folder_id, user_id)
            if not target:
                raise NotFound("Folder not found")
            target.is_shared = True

        share = self.shares.create(
            file_id=data.file_id, folder_id=data.folder_id, created_by=user_id,
            token=generate_share_token(),
            password_hash=hash_password(data.password) if data.password else None,
            expires_at=data.expires_at, max_downloads=data.max_downloads,
        )
        self.logs.create(user_id=user_id, action=ACTION_SHARE_CREATED,
                         resource_type=RESOURCE_SHARE, resource_id=share.id)
        self.db.commit()
        return share

    def list_mine(self, user_id: int) -> list[Share]:
        return self.shares.list_for_user(user_id)

    def get_owned(self, share_id: int, user_id: int) -> Share:
        share = self.shares.get_owned(share_id, user_id)
        if not share:
            raise NotFound("Share not found")
        return share

    def revoke(self, share_id: int, user_id: int) -> None:
        share = self.get_owned(share_id, user_id)
        share.is_active = False
        self.logs.create(user_id=user_id, action=ACTION_SHARE_REVOKED,
                         resource_type=RESOURCE_SHARE, resource_id=share.id)
        self.db.commit()

    # ── public access ──
    def _validate(self, token: str) -> Share:
        share = self.shares.get_by_token(token)
        if not share or not share.is_active:
            raise ShareDisabled("This share link is no longer available")
        if share.expires_at:
            exp = share.expires_at
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp < datetime.now(timezone.utc):
                raise ShareExpired("This share link has expired")
        if share.max_downloads is not None and share.download_count >= share.max_downloads:
            raise ShareDisabled("Download limit reached")
        return share

    def public_info(self, token: str) -> dict:
        share = self._validate(token)
        requires_password = share.password_hash is not None
        if share.file_id:
            f = self.files.get(share.file_id)
            owner = self.users.get(share.created_by)
            return {
                "type": "file", "name": f.filename if f else "file",
                "size_bytes": f.size_bytes if f else None,
                "owner": owner.email if owner else None,
                "requires_password": requires_password, "expired": False,
            }
        folder = self.folders.get(share.folder_id)
        return {
            "type": "folder", "name": folder.name if folder else "folder",
            "size_bytes": None, "owner": None,
            "requires_password": requires_password, "expired": False,
        }

    def verify_password(self, token: str, password: str) -> bool:
        share = self._validate(token)
        if not share.password_hash:
            return True
        return verify_password(password, share.password_hash)

    def resolve_download(self, token: str, password: str | None) -> tuple[Share, str, str]:
        share = self._validate(token)
        if not share.file_id:
            raise NotFound("This share points to a folder, not a single file")
        if share.password_hash and not (password and verify_password(password, share.password_hash)):
            raise ShareDisabled("Password required or incorrect")
        from app.services.storage_service import storage
        f = self.files.get(share.file_id)
        if not f or not storage.exists(f.storage_path):
            raise NotFound("Shared file is missing")
        share.download_count += 1
        self.db.commit()
        return share, f.filename, str(storage.absolute(f.storage_path))
