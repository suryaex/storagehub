from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    avatar_url: str | None = None
    role: str
    status: str
    quota_bytes: int
    used_bytes: int
    last_login_at: datetime | None = None
    created_at: datetime | None = None


class UserUpdate(BaseModel):
    full_name: str | None = None
    role: str | None = None
    status: str | None = None
    quota_bytes: int | None = None


class ProfileUpdate(BaseModel):
    full_name: str
