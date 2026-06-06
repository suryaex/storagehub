from __future__ import annotations

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog


class ActivityLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> ActivityLog:
        log = ActivityLog(**kwargs)
        self.db.add(log)
        self.db.flush()
        return log

    def list(self, page: int, limit: int, action: str | None = None,
             user_id: int | None = None, date_from: datetime | None = None,
             date_to: datetime | None = None) -> tuple[list[ActivityLog], int]:
        stmt = select(ActivityLog)
        if action:
            stmt = stmt.where(ActivityLog.action == action)
        if user_id:
            stmt = stmt.where(ActivityLog.user_id == user_id)
        if date_from:
            stmt = stmt.where(ActivityLog.created_at >= date_from)
        if date_to:
            stmt = stmt.where(ActivityLog.created_at <= date_to)
        total = self.db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        rows = self.db.scalars(
            stmt.order_by(ActivityLog.created_at.desc())
            .offset((page - 1) * limit).limit(limit)
        ).all()
        return list(rows), total
