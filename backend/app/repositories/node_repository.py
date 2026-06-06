from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.storage_node import StorageNode


class NodeRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, node_id: int) -> StorageNode | None:
        return self.db.get(StorageNode, node_id)

    def get_by_name(self, name: str) -> StorageNode | None:
        return self.db.scalar(select(StorageNode).where(StorageNode.name == name))

    def get_primary(self) -> StorageNode | None:
        return self.db.scalar(select(StorageNode).where(StorageNode.is_primary.is_(True)))

    def list(self) -> list[StorageNode]:
        return list(self.db.scalars(
            select(StorageNode).order_by(StorageNode.is_primary.desc(), StorageNode.id.asc())
        ).all())

    def create(self, **kwargs) -> StorageNode:
        node = StorageNode(**kwargs)
        self.db.add(node)
        self.db.flush()
        return node

    def clear_primary(self) -> None:
        for n in self.db.scalars(select(StorageNode).where(StorageNode.is_primary.is_(True))).all():
            n.is_primary = False
        self.db.flush()

    def delete(self, node: StorageNode) -> None:
        self.db.delete(node)
        self.db.flush()
