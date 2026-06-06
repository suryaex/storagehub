from __future__ import annotations

from pydantic import BaseModel

from app.schemas.file import FileResponse
from app.schemas.share import ShareResponse


class StorageUsage(BaseModel):
    used_bytes: int
    quota_bytes: int


class DashboardSummary(BaseModel):
    storage_usage: StorageUsage
    recent_files: list[FileResponse]
    recent_uploads: list[FileResponse]
    shared_files: list[ShareResponse]
    file_count: int
    folder_count: int
