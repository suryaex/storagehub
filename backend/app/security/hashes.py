"""Password and token hashing helpers."""
from __future__ import annotations

import hashlib

from passlib.context import CryptContext

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return _pwd_context.verify(plain, hashed)
    except Exception:
        return False


def sha256_hex(value: str) -> str:
    """Deterministic SHA-256 hex digest — used to store refresh tokens."""
    return hashlib.sha256(value.encode("utf-8")).hexdigest()
