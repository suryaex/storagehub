"""Shared FastAPI dependencies (auth guards, current user)."""
from __future__ import annotations

import jwt
from fastapi import Depends, Header, Query, Request
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


def _user_from_payload(payload: dict, db: Session) -> User:
    user = UserRepository(db).get(int(payload["sub"]))
    if not user or user.deleted_at is not None:
        raise InvalidToken("User not found")
    if user.status == "disabled":
        raise UserDisabled("Account is disabled")
    return user


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
    return _user_from_payload(payload, db)


def get_preview_user(
    file_id: int,
    authorization: str | None = Header(default=None),
    token: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> User:
    """Auth for the inline-preview route. Accepts the normal Authorization
    header (fetch/XHR clients, e.g. the text-preview path), or, since
    <img>/<video>/<iframe> cannot set custom headers, a short-lived
    preview token bound to this exact file_id in the query string.
    """
    if authorization:
        return get_current_user(authorization, db)
    if not token:
        raise InvalidToken("Missing bearer token")
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError as exc:
        raise InvalidToken("Preview link expired") from exc
    except jwt.PyJWTError as exc:
        raise InvalidToken("Invalid preview link") from exc
    if payload.get("type") != "preview" or payload.get("fid") != file_id:
        raise InvalidToken("Invalid preview link")
    return _user_from_payload(payload, db)


def get_admin_user(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise Forbidden("Admin privileges required")
    return user


def client_meta(request: Request) -> dict:
    return {
        "ip": request.client.host if request.client else None,
        "ua": request.headers.get("user-agent"),
    }
