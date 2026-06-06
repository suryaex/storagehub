"""Admin overview, activity logs and system settings."""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.folder import Folder
from app.models.user import User
from app.repositories.activity_log_repository import ActivityLogRepository
from app.repositories.file_repository import FileRepository
from app.repositories.settings_repository import SettingsRepository
from app.repositories.share_repository import ShareRepository


class AdminService:
    def __init__(self, db: Session):
        self.db = db
        self.files = FileRepository(db)
        self.shares = ShareRepository(db)
        self.logs = ActivityLogRepository(db)
        self.settings = SettingsRepository(db)

    def overview(self) -> dict:
        total_users = self.db.scalar(select(func.count(User.id))) or 0
        active_users = self.db.scalar(
            select(func.count(User.id)).where(User.status == "active")
        ) or 0
        total_folders = self.db.scalar(select(func.count(Folder.id))) or 0
        return {
            "total_users": total_users,
            "active_users": active_users,
            "total_files": self.files.count_all(),
            "total_folders": total_folders,
            "total_storage_bytes": self.files.total_size(),
            "total_shares": self.shares.count_all(),
        }

    def activity_logs(self, page, limit, action, user_id, date_from, date_to):
        return self.logs.list(page, limit, action, user_id, date_from, date_to)

    def get_settings(self) -> dict:
        return {s.setting_key: s.setting_value for s in self.settings.all()}

    def update_settings(self, data) -> dict:  # noqa: ANN001
        mapping = {
            "default_user_quota": (data.default_user_quota, "number"),
            "trash_retention_days": (data.trash_retention_days, "number"),
            "max_upload_size": (data.max_upload_size, "number"),
        }
        for key, (value, vtype) in mapping.items():
            if value is not None:
                self.settings.upsert(key, str(value), vtype)
        self.db.commit()
        return self.get_settings()
