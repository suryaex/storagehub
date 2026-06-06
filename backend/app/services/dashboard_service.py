"""Dashboard summary aggregation."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories.file_repository import FileRepository
from app.repositories.folder_repository import FolderRepository
from app.repositories.share_repository import ShareRepository
from app.repositories.user_repository import UserRepository


class DashboardService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)
        self.files = FileRepository(db)
        self.folders = FolderRepository(db)
        self.shares = ShareRepository(db)

    def summary(self, user_id: int) -> dict:
        user = self.users.get(user_id)
        recent = self.files.recent(user_id, 10)
        return {
            "storage_usage": {
                "used_bytes": user.used_bytes,
                "quota_bytes": user.quota_bytes,
            },
            "recent_files": recent,
            "recent_uploads": recent,
            "shared_files": self.shares.list_for_user(user_id, limit=10),
            "file_count": self.files.count(user_id),
            "folder_count": self.folders.count(user_id),
        }
