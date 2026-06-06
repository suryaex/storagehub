from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.oauth_account import OAuthAccount


class OAuthRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_subject(self, provider: str, subject: str) -> OAuthAccount | None:
        return self.db.scalar(
            select(OAuthAccount).where(
                OAuthAccount.provider == provider,
                OAuthAccount.provider_subject == subject,
            )
        )

    def create(self, **kwargs) -> OAuthAccount:
        acc = OAuthAccount(**kwargs)
        self.db.add(acc)
        self.db.flush()
        return acc
