from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    folder_id: int
    owner_id: int
    filename: str
    original_filename: str
    mime_type: str
    extension: str | None = None
    size_bytes: int
    checksum_sha256: str
    version: int
    is_shared: bool
    is_deleted: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None


class FileRename(BaseModel):
    filename: str = Field(min_length=1, max_length=255)


class FileMove(BaseModel):
    folder_id: int


class FileCopy(BaseModel):
    folder_id: int


class FolderContents(BaseModel):
    folder: FolderResponse | None = None
    subfolders: list["FolderResponse"]
    files: list[FileResponse]


from app.schemas.folder import FolderResponse  # noqa: E402

FolderContents.model_rebuild()
