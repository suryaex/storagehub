from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, model_validator


class ShareCreate(BaseModel):
    file_id: int | None = None
    folder_id: int | None = None
    password: str | None = None
    expires_at: datetime | None = None
    max_downloads: int | None = None

    @model_validator(mode="after")
    def _one_target(self):
        if bool(self.file_id) == bool(self.folder_id):
            raise ValueError("Exactly one of file_id or folder_id must be provided")
        return self


class ShareResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    file_id: int | None = None
    folder_id: int | None = None
    created_by: int
    token: str
    has_password: bool = False
    expires_at: datetime | None = None
    max_downloads: int | None = None
    download_count: int
    is_active: bool
    share_url: str | None = None
    created_at: datetime | None = None


class SharePasswordRequest(BaseModel):
    password: str


class PublicShareInfo(BaseModel):
    type: str
    name: str
    size_bytes: int | None = None
    owner: str | None = None
    requires_password: bool = False
    expired: bool = False
