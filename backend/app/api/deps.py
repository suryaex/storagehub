"""Shared FastAPI dependencies (auth guards, current user)."""
from __future__ import annotations

import jwt
from fastapi import Depends, Header, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.exceptions.auth import InvalidToken, UserDisabled
from app.exceptions.base import Forbidden
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.security.jwt import decode_token


def _extract_token(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise InvalidToken("Missing bearer token")
    return authorization.split(" ", 1)[1].strip()


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    token = _extract_token(authorization)
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError as exc:
        raise InvalidToken("Access token expired") from exc
    except jwt.PyJWTError as exc:
        raise InvalidToken("Invalid access token") from exc

    if payload.get("type") != "access":
        raise InvalidToken("Invalid token type")
    user = UserRepository(db).get(int(payload["sub"]))
    if not user or user.deleted_at is not None:
        raise InvalidToken("User not found")
    if user.status == "disabled":
        raise UserDisabled("Account is disabled")
    return user


def get_admin_user(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise Forbidden("Admin privileges required")
    return user


def client_meta(request: Request) -> dict:
    return {
        "ip": request.client.host if request.client else None,
        "ua": request.headers.get("user-agent"),
    }
