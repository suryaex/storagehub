from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.file import FileResponse
from app.schemas.folder import FolderResponse
from app.schemas.share import ShareResponse
from app.services.search_service import SearchService
from app.utils.response import success

router = APIRouter()


@router.get("")
def search(q: str = Query(..., min_length=1), type: str | None = None,  # noqa: A002
           extension: str | None = None, db: Session = Depends(get_db),
           user: User = Depends(get_current_user)):
    results = SearchService(db).search(user.id, q, type, extension)
    return success({
        "files": [FileResponse.model_validate(f).model_dump(mode="json") for f in results["files"]],
        "folders": [FolderResponse.model_validate(x).model_dump(mode="json") for x in results["folders"]],
        "shares": [ShareResponse.model_validate(s).model_dump(mode="json") for s in results["shares"]],
    })


@router.get("/recent")
def recent_searches(_: User = Depends(get_current_user)):
    # Recent searches are kept client-side in this build.
    return success({"recent": []})


@router.get("/suggestions")
def suggestions(q: str = Query(""), db: Session = Depends(get_db),
                user: User = Depends(get_current_user)):
    if not q:
        return success({"suggestions": []})
    results = SearchService(db).search(user.id, q)
    names = [f.filename for f in results["files"][:5]] + [x.name for x in results["folders"][:5]]
    return success({"suggestions": names})
