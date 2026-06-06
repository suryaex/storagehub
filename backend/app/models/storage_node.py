from __future__ import annotations

from sqlalchemy import BigInteger, Boolean, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, BigIntPK, TimestampMixin


class StorageNode(Base, TimestampMixin):
    """A storage node — the primary local disk, an extra mount, or a remote node."""
    __tablename__ = "storage_nodes"

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    node_type: Mapped[str] = mapped_column(
        Enum("local", "remote", "s3", "webdav"), default="local", nullable=False
    )
    location: Mapped[str] = mapped_column(Text, nullable=False)  # path or URL
    storage_type: Mapped[str] = mapped_column(
        Enum("auto", "ssd", "hdd", "nvme", "raid"), default="auto", nullable=False
    )
    raid_level: Mapped[str] = mapped_column(String(20), default="none", nullable=False)
    status: Mapped[str] = mapped_column(
        Enum("online", "offline", "degraded", "unknown"), default="unknown", nullable=False
    )
    capacity_bytes: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    used_bytes: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
