from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.file import FileResponse
from app.schemas.share import ShareResponse
from app.services.dashboard_service import DashboardService
from app.services.share_service import ShareService
from app.utils.response import success

router = APIRouter()


@router.get("/summary")
def summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    data = DashboardService(db).summary(user.id)
    share_service = ShareService(db)

    def share_ser(s):
        d = ShareResponse.model_validate(s).model_dump(mode="json")
        d["has_password"] = s.password_hash is not None
        d["share_url"] = share_service.share_url(s.token)
        return d

    return success({
        "storage_usage": data["storage_usage"],
        "recent_files": [FileResponse.model_validate(f).model_dump(mode="json")
                         for f in data["recent_files"]],
        "recent_uploads": [FileResponse.model_validate(f).model_dump(mode="json")
                           for f in data["recent_uploads"]],
        "shared_files": [share_ser(s) for s in data["shared_files"]],
        "file_count": data["file_count"],
        "folder_count": data["folder_count"],
    })
