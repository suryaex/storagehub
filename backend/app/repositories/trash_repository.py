from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.trash_item import TrashItem


class TrashRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> TrashItem:
        item = TrashItem(**kwargs)
        self.db.add(item)
        self.db.flush()
        return item

    def get_owned(self, item_id: int, user_id: int) -> TrashItem | None:
        return self.db.scalar(
            select(TrashItem).where(TrashItem.id == item_id, TrashItem.user_id == user_id)
        )

    def list_for_user(self, user_id: int) -> list[TrashItem]:
        return list(self.db.scalars(
            select(TrashItem)
            .where(TrashItem.user_id == user_id, TrashItem.restored_at.is_(None))
            .order_by(TrashItem.deleted_at.desc())
        ).all())

    def find(self, user_id: int, item_type: str, item_id: int) -> TrashItem | None:
        return self.db.scalar(
            select(TrashItem).where(
                TrashItem.user_id == user_id,
                TrashItem.item_type == item_type,
                TrashItem.item_id == item_id,
                TrashItem.restored_at.is_(None),
            )
        )

    def delete(self, item: TrashItem) -> None:
        self.db.delete(item)
        self.db.flush()
