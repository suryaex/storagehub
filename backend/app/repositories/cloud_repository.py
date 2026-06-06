from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.cloud_target import CloudTarget


class CloudRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, target_id: int) -> CloudTarget | None:
        return self.db.get(CloudTarget, target_id)

    def get_by_name(self, name: str) -> CloudTarget | None:
        return self.db.scalar(select(CloudTarget).where(CloudTarget.name == name))

    def list(self) -> list[CloudTarget]:
        return list(self.db.scalars(select(CloudTarget).order_by(CloudTarget.id.asc())).all())

    def create(self, **kwargs) -> CloudTarget:
        target = CloudTarget(**kwargs)
        self.db.add(target)
        self.db.flush()
        return target

    def delete(self, target: CloudTarget) -> None:
        self.db.delete(target)
        self.db.flush()
