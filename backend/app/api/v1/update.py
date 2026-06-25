"""In-app update endpoints.

GET  /api/v1/update/check   — any authenticated user may check.
GET  /api/v1/update/status  — progress reported by scripts/self-update.sh.
POST /api/v1/update/apply   — admin only; triggers pull + rebuild + restart.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_admin_user, get_current_user
from app.models.user import User
from app.services import updater

router = APIRouter()


@router.get("/check")
def update_check(_: User = Depends(get_current_user)) -> dict:
    return updater.check()


@router.get("/status")
def update_status(_: User = Depends(get_current_user)) -> dict:
    return updater.status()


@router.post("/apply")
def update_apply(_: User = Depends(get_admin_user)) -> dict:
    return updater.apply()
