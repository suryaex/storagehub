from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class StorageNodeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    node_type: str
    location: str
    storage_type: str
    raid_level: str
    status: str
    capacity_bytes: int
    used_bytes: int
    is_primary: bool
    created_at: datetime | None = None


class StorageNodeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    node_type: str = "local"
    location: str = Field(min_length=1)
    storage_type: str = "auto"
    raid_level: str = "none"


class StorageNodeUpdate(BaseModel):
    name: str | None = None
    location: str | None = None
    storage_type: str | None = None
    raid_level: str | None = None
    status: str | None = None


class CloudTargetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    provider: str
    endpoint: str | None = None
    bucket: str | None = None
    access_key: str | None = None
    sync_mode: str
    enabled: bool
    status: str
    last_sync_at: datetime | None = None
    created_at: datetime | None = None


class CloudTargetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    provider: str
    endpoint: str | None = None
    bucket: str | None = None
    access_key: str | None = None
    secret_key: str | None = None
    sync_mode: str = "backup"
    enabled: bool = False


class CloudTargetUpdate(BaseModel):
    name: str | None = None
    endpoint: str | None = None
    bucket: str | None = None
    access_key: str | None = None
    secret_key: str | None = None
    sync_mode: str | None = None
    enabled: bool | None = None
