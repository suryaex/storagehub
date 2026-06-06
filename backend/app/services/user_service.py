"""User profile + admin user management."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.constants import ACTION_ADMIN_UPDATE_USER, RESOURCE_USER
from app.exceptions.base import NotFound, ValidationError
from app.models.user import User
from app.repositories.activity_log_repository import ActivityLogRepository
from app.repositories.user_repository import UserRepository


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)
        self.logs = ActivityLogRepository(db)

    def get(self, user_id: int) -> User:
        user = self.users.get(user_id)
        if not user or user.deleted_at is not None:
            raise NotFound("User not found")
        return user

    def list(self, page: int, limit: int, search: str | None, role: str | None,
             status: str | None):
        return self.users.list(page, limit, search, role, status)

    def update(self, admin_id: int, user_id: int, data) -> User:  # noqa: ANN001
        user = self.get(user_id)
        if data.full_name is not None:
            user.full_name = data.full_name
        if data.role is not None:
            if data.role not in ("admin", "user"):
                raise ValidationError("Invalid role")
            user.role = data.role
        if data.status is not None:
            if data.status not in ("active", "disabled", "pending"):
                raise ValidationError("Invalid status")
            user.status = data.status
        if data.quota_bytes is not None:
            if data.quota_bytes < 0:
                raise ValidationError("Quota must be positive")
            user.quota_bytes = data.quota_bytes
        self.logs.create(user_id=admin_id, action=ACTION_ADMIN_UPDATE_USER,
                         resource_type=RESOURCE_USER, resource_id=user.id)
        self.db.commit()
        return user

    def update_profile(self, user_id: int, full_name: str) -> User:
        user = self.get(user_id)
        user.full_name = full_name
        self.db.commit()
        return user

    def set_status(self, user_id: int, status: str) -> User:
        user = self.get(user_id)
        user.status = status
        self.db.commit()
        return user

    def update_quota(self, user_id: int, quota_bytes: int) -> User:
        if quota_bytes < 0:
            raise ValidationError("Quota must be positive")
        user = self.get(user_id)
        user.quota_bytes = quota_bytes
        self.db.commit()
        return user

    def soft_delete(self, user_id: int) -> None:
        user = self.get(user_id)
        user.deleted_at = datetime.now(timezone.utc)
        user.status = "disabled"
        self.db.commit()
