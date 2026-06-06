from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, BigIntPK


class TrashItem(Base):
    __tablename__ = "trash_items"

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    item_type: Mapped[str] = mapped_column(Enum("file", "folder"), nullable=False)
    item_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    original_path: Mapped[str] = mapped_column(Text, nullable=False)
    deleted_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    restored_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
