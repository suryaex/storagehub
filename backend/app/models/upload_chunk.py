from __future__ import annotations

from sqlalchemy import BigInteger, CHAR, Enum, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, BigIntPK, TimestampMixin


class UploadChunk(Base, TimestampMixin):
    __tablename__ = "upload_chunks"
    __table_args__ = (
        UniqueConstraint("session_id", "chunk_index", name="uq_session_chunk"),
    )

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("upload_sessions.id", ondelete="CASCADE"), nullable=False
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    chunk_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    chunk_hash: Mapped[str | None] = mapped_column(CHAR(64), nullable=True)
    storage_path: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        Enum("pending", "uploaded", "merged", "failed"), default="pending", nullable=False
    )

    session = relationship("UploadSession", back_populates="chunks")
