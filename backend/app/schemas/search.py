from __future__ import annotations

from pydantic import BaseModel

from app.schemas.file import FileResponse
from app.schemas.folder import FolderResponse
from app.schemas.share import ShareResponse


class SearchResults(BaseModel):
    files: list[FileResponse]
    folders: list[FolderResponse]
    shares: list[ShareResponse]
