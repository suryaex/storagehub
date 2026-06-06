from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FolderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    parent_id: int | None = None
    owner_id: int
    name: str
    path: str
    is_shared: bool
    is_deleted: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None


class FolderCreate(BaseModel):
    parent_id: int | None = None
    name: str = Field(min_length=1, max_length=255)


class FolderRename(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class FolderMove(BaseModel):
    parent_id: int | None = None
