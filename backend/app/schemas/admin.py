from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class QuotaUpdate(BaseModel):
    quota_bytes: int


class SystemOverview(BaseModel):
    total_users: int
    active_users: int
    total_files: int
    total_folders: int
    total_storage_bytes: int
    total_shares: int


class ActivityLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None = None
    action: str
    resource_type: str
    resource_id: int | None = None
    ip_address: str | None = None
    metadata_json: dict | None = None
    created_at: datetime


class SystemSettingsUpdate(BaseModel):
    default_user_quota: int | None = None
    trash_retention_days: int | None = None
    max_upload_size: int | None = None
