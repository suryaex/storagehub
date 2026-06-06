from __future__ import annotations

from pydantic import BaseModel, Field


class UploadSessionCreate(BaseModel):
    folder_id: int
    file_name: str = Field(min_length=1, max_length=255)
    original_filename: str | None = None
    mime_type: str = "application/octet-stream"
    size_bytes: int = Field(gt=0)
    chunk_size_bytes: int = Field(gt=0, default=8_388_608)
    checksum_sha256: str | None = None


class UploadSessionResponse(BaseModel):
    session_id: int
    total_chunks: int
    uploaded_chunks: int
    status: str
    chunk_size_bytes: int


class UploadSessionStatus(BaseModel):
    session_id: int
    status: str
    total_chunks: int
    uploaded_chunks: int


class ResumeResponse(BaseModel):
    missing_chunks: list[int]


class ChunkProgress(BaseModel):
    session_id: int
    chunk_index: int
    uploaded_chunks: int
    total_chunks: int
