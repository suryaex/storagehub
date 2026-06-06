from __future__ import annotations

from sqlalchemy import BigInteger, Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, BigIntPK, TimestampMixin


class QuotaPolicy(Base, TimestampMixin):
    __tablename__ = "quota_policies"

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    quota_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    applies_to_role: Mapped[str | None] = mapped_column(Enum("admin", "user"), nullable=True)
    applies_to_user_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
