from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.folder import Folder


class FolderRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, folder_id: int) -> Folder | None:
        return self.db.get(Folder, folder_id)

    def get_owned(self, folder_id: int, owner_id: int) -> Folder | None:
        return self.db.scalar(
            select(Folder).where(Folder.id == folder_id, Folder.owner_id == owner_id)
        )

    def get_root(self, owner_id: int) -> Folder | None:
        return self.db.scalar(
            select(Folder).where(Folder.owner_id == owner_id, Folder.parent_id.is_(None))
        )

    def get_by_name(self, owner_id: int, parent_id: int | None, name: str) -> Folder | None:
        stmt = select(Folder).where(Folder.owner_id == owner_id, Folder.name == name)
        stmt = stmt.where(Folder.parent_id.is_(None) if parent_id is None
                          else Folder.parent_id == parent_id)
        return self.db.scalar(stmt)

    def list_children(self, owner_id: int, parent_id: int | None,
                      include_deleted: bool = False) -> list[Folder]:
        stmt = select(Folder).where(Folder.owner_id == owner_id)
        stmt = stmt.where(Folder.parent_id.is_(None) if parent_id is None
                          else Folder.parent_id == parent_id)
        if not include_deleted:
            stmt = stmt.where(Folder.is_deleted.is_(False))
        return list(self.db.scalars(stmt.order_by(Folder.name.asc())).all())

    def count(self, owner_id: int) -> int:
        return self.db.scalar(
            select(func.count(Folder.id)).where(
                Folder.owner_id == owner_id, Folder.is_deleted.is_(False)
            )
        ) or 0

    def create(self, **kwargs) -> Folder:
        folder = Folder(**kwargs)
        self.db.add(folder)
        self.db.flush()
        return folder

    def search(self, owner_id: int, query: str, limit: int = 20) -> list[Folder]:
        like = f"%{query}%"
        return list(self.db.scalars(
            select(Folder)
            .where(Folder.owner_id == owner_id, Folder.is_deleted.is_(False),
                   Folder.name.like(like))
            .limit(limit)
        ).all())
