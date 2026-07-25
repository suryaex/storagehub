from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse as FastAPIFileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.exceptions.storage import PreviewNotSupported
from app.models.user import User
from app.schemas.share import ShareCreate, SharePasswordRequest, ShareResponse
from app.services.share_service import ShareService
from app.utils.mime_sniff import preview_response_headers, sniff_preview_mime
from app.utils.response import success

router = APIRouter()


def _ser(share, service: ShareService) -> dict:
    data = ShareResponse.model_validate(share).model_dump(mode="json")
    data["has_password"] = share.password_hash is not None
    data["share_url"] = service.share_url(share.token)
    return data


# ── authenticated owner endpoints ──
@router.post("/shares")
def create_share(payload: ShareCreate, db: Session = Depends(get_db),
                 user: User = Depends(get_current_user)):
    service = ShareService(db)
    share = service.create(user.id, payload)
    return success(_ser(share, service), "Share created")


@router.get("/shares")
def list_shares(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    service = ShareService(db)
    return success([_ser(s, service) for s in service.list_mine(user.id)])


@router.get("/shares/{share_id}")
def share_detail(share_id: int, db: Session = Depends(get_db),
                 user: User = Depends(get_current_user)):
    service = ShareService(db)
    return success(_ser(service.get_owned(share_id, user.id), service))


@router.delete("/shares/{share_id}")
def revoke_share(share_id: int, db: Session = Depends(get_db),
                 user: User = Depends(get_current_user)):
    ShareService(db).revoke(share_id, user.id)
    return success(None, "Share revoked")


# ── public endpoints ──
@router.get("/share/{token}")
def public_share(token: str, db: Session = Depends(get_db)):
    return success(ShareService(db).public_info(token))


@router.post("/share/{token}/password")
def verify_share_password(token: str, payload: SharePasswordRequest,
                          db: Session = Depends(get_db)):
    ok = ShareService(db).verify_password(token, payload.password)
    return success({"valid": ok}, "OK" if ok else "Invalid password")


@router.get("/share/{token}/download")
def download_share(token: str, password: str | None = None, db: Session = Depends(get_db)):
    _, filename, path = ShareService(db).resolve_download(token, password)
    return FastAPIFileResponse(path, filename=filename)


@router.get("/share/{token}/preview")
def preview_share(token: str, password: str | None = None, db: Session = Depends(get_db)):
    # Same authorization as download (active/expiry/max-downloads/password —
    # all in ShareService._resolve_file_share, shared with resolve_download),
    # but resolve_preview does NOT increment download_count: viewing a
    # preview must not consume a limited share's download budget.
    _, filename, path = ShareService(db).resolve_preview(token, password)
    mime = sniff_preview_mime(Path(path))
    if mime is None:
        raise PreviewNotSupported("This file type cannot be previewed")
    return FastAPIFileResponse(path, media_type=mime, filename=filename,
                               content_disposition_type="inline",
                               headers=preview_response_headers())
