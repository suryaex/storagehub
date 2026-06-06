from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, user_id: int) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        return self.db.scalar(select(User).where(User.email == email))

    def count(self) -> int:
        return self.db.scalar(select(func.count(User.id))) or 0

    def create(self, **kwargs) -> User:
        user = User(**kwargs)
        self.db.add(user)
        self.db.flush()
        return user

    def list(self, page: int, limit: int, search: str | None = None,
             role: str | None = None, status: str | None = None) -> tuple[list[User], int]:
        stmt = select(User).where(User.deleted_at.is_(None))
        if search:
            like = f"%{search}%"
            stmt = stmt.where(or_(User.email.like(like), User.full_name.like(like)))
        if role:
            stmt = stmt.where(User.role == role)
        if status:
            stmt = stmt.where(User.status == status)
        total = self.db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        rows = self.db.scalars(
            stmt.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit)
        ).all()
        return list(rows), total

    def add_used_bytes(self, user: User, delta: int) -> None:
        user.used_bytes = max(0, (user.used_bytes or 0) + delta)
        self.db.flush()
