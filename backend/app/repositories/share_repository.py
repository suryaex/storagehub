from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.share import Share


class ShareRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, share_id: int) -> Share | None:
        return self.db.get(Share, share_id)

    def get_owned(self, share_id: int, owner_id: int) -> Share | None:
        return self.db.scalar(
            select(Share).where(Share.id == share_id, Share.created_by == owner_id)
        )

    def get_by_token(self, token: str) -> Share | None:
        return self.db.scalar(select(Share).where(Share.token == token))

    def list_for_user(self, owner_id: int, limit: int | None = None) -> list[Share]:
        stmt = select(Share).where(Share.created_by == owner_id).order_by(Share.created_at.desc())
        if limit:
            stmt = stmt.limit(limit)
        return list(self.db.scalars(stmt).all())

    def count_all(self) -> int:
        return self.db.scalar(select(func.count(Share.id))) or 0

    def create(self, **kwargs) -> Share:
        share = Share(**kwargs)
        self.db.add(share)
        self.db.flush()
        return share

    def search(self, owner_id: int, query: str, limit: int = 20) -> list[Share]:
        return list(self.db.scalars(
            select(Share)
            .where(Share.created_by == owner_id, Share.token.like(f"%{query}%"))
            .limit(limit)
        ).all())
