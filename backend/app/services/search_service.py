"""Search across files, folders and shares."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories.file_repository import FileRepository
from app.repositories.folder_repository import FolderRepository
from app.repositories.share_repository import ShareRepository


class SearchService:
    def __init__(self, db: Session):
        self.db = db
        self.files = FileRepository(db)
        self.folders = FolderRepository(db)
        self.shares = ShareRepository(db)

    def search(self, user_id: int, query: str, type_filter: str | None = None,
               extension: str | None = None) -> dict:
        query = (query or "").strip()
        if not query:
            return {"files": [], "folders": [], "shares": []}
        files = folders = shares = []
        if type_filter in (None, "file"):
            files = self.files.search(user_id, query, extension)
        if type_filter in (None, "folder"):
            folders = self.folders.search(user_id, query)
        if type_filter in (None, "share"):
            shares = self.shares.search(user_id, query)
        return {"files": files, "folders": folders, "shares": shares}
