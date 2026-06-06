from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.file import File


class FileRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, file_id: int) -> File | None:
        return self.db.get(File, file_id)

    def get_owned(self, file_id: int, owner_id: int) -> File | None:
        return self.db.scalar(
            select(File).where(File.id == file_id, File.owner_id == owner_id)
        )

    def list_in_folder(self, owner_id: int, folder_id: int,
                       include_deleted: bool = False) -> list[File]:
        stmt = select(File).where(File.owner_id == owner_id, File.folder_id == folder_id)
        if not include_deleted:
            stmt = stmt.where(File.is_deleted.is_(False))
        return list(self.db.scalars(stmt.order_by(File.filename.asc())).all())

    def list(self, owner_id: int, folder_id: int | None, page: int, limit: int,
             search: str | None = None, extension: str | None = None) -> tuple[list[File], int]:
        stmt = select(File).where(File.owner_id == owner_id, File.is_deleted.is_(False))
        if folder_id:
            stmt = stmt.where(File.folder_id == folder_id)
        if search:
            stmt = stmt.where(File.filename.like(f"%{search}%"))
        if extension:
            stmt = stmt.where(File.extension == extension.lower())
        total = self.db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        rows = self.db.scalars(
            stmt.order_by(File.created_at.desc()).offset((page - 1) * limit).limit(limit)
        ).all()
        return list(rows), total

    def recent(self, owner_id: int, limit: int = 10) -> list[File]:
        return list(self.db.scalars(
            select(File)
            .where(File.owner_id == owner_id, File.is_deleted.is_(False))
            .order_by(File.created_at.desc())
            .limit(limit)
        ).all())

    def count(self, owner_id: int) -> int:
        return self.db.scalar(
            select(func.count(File.id)).where(
                File.owner_id == owner_id, File.is_deleted.is_(False)
            )
        ) or 0

    def total_size(self) -> int:
        return self.db.scalar(
            select(func.coalesce(func.sum(File.size_bytes), 0)).where(File.is_deleted.is_(False))
        ) or 0

    def count_all(self) -> int:
        return self.db.scalar(select(func.count(File.id))) or 0

    def create(self, **kwargs) -> File:
        f = File(**kwargs)
        self.db.add(f)
        self.db.flush()
        return f

    def search(self, owner_id: int, query: str, extension: str | None = None,
               limit: int = 30) -> list[File]:
        stmt = select(File).where(
            File.owner_id == owner_id, File.is_deleted.is_(False),
            File.filename.like(f"%{query}%"),
        )
        if extension:
            stmt = stmt.where(File.extension == extension.lower())
        return list(self.db.scalars(stmt.limit(limit)).all())
