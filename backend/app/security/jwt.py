"""JWT access-token creation and decoding."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import settings


def create_access_token(subject: str | int, extra: dict | None = None) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(subject),
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def create_preview_token(user_id: int, file_id: int, ttl_seconds: int = 60) -> str:
    """Very short-lived, single-file-scoped token for <img>/<video>/<iframe>
    src URLs, which cannot carry an Authorization header. Deliberately not
    the long-lived access token: if it leaks (browser history, proxy/access
    logs) it is useless after ~1 minute and only for this one file_id.
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "type": "preview",
        "fid": file_id,
        "iat": now,
        "exp": now + timedelta(seconds=ttl_seconds),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
