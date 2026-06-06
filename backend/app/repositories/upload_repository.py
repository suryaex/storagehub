from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.upload_chunk import UploadChunk
from app.models.upload_session import UploadSession


class UploadRepository:
    def __init__(self, db: Session):
        self.db = db

    # ── sessions ──
    def get_session(self, session_id: int) -> UploadSession | None:
        return self.db.get(UploadSession, session_id)

    def get_owned_session(self, session_id: int, user_id: int) -> UploadSession | None:
        return self.db.scalar(
            select(UploadSession).where(
                UploadSession.id == session_id, UploadSession.user_id == user_id
            )
        )

    def create_session(self, **kwargs) -> UploadSession:
        s = UploadSession(**kwargs)
        self.db.add(s)
        self.db.flush()
        return s

    # ── chunks ──
    def get_chunk(self, session_id: int, chunk_index: int) -> UploadChunk | None:
        return self.db.scalar(
            select(UploadChunk).where(
                UploadChunk.session_id == session_id,
                UploadChunk.chunk_index == chunk_index,
            )
        )

    def list_chunks(self, session_id: int) -> list[UploadChunk]:
        return list(self.db.scalars(
            select(UploadChunk)
            .where(UploadChunk.session_id == session_id)
            .order_by(UploadChunk.chunk_index.asc())
        ).all())

    def uploaded_indexes(self, session_id: int) -> set[int]:
        rows = self.db.scalars(
            select(UploadChunk.chunk_index).where(
                UploadChunk.session_id == session_id,
                UploadChunk.status.in_(("uploaded", "merged")),
            )
        ).all()
        return set(rows)

    def create_chunk(self, **kwargs) -> UploadChunk:
        c = UploadChunk(**kwargs)
        self.db.add(c)
        self.db.flush()
        return c
