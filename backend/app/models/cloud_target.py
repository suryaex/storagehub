from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, BigIntPK, TimestampMixin


class CloudTarget(Base, TimestampMixin):
    """A remote cloud destination to sync/backup to (S3, WebDAV, etc.)."""
    __tablename__ = "cloud_targets"

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    provider: Mapped[str] = mapped_column(
        Enum("s3", "webdav", "gdrive", "dropbox"), nullable=False
    )
    endpoint: Mapped[str | None] = mapped_column(Text, nullable=True)
    bucket: Mapped[str | None] = mapped_column(String(255), nullable=True)
    access_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    secret_key: Mapped[str | None] = mapped_column(String(255), nullable=True)  # never returned
    sync_mode: Mapped[str] = mapped_column(
        Enum("backup", "mirror"), default="backup", nullable=False
    )
    enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="idle", nullable=False)
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
