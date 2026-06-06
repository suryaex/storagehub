from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin import ActivityLogResponse, QuotaUpdate, SystemSettingsUpdate
from app.schemas.user import UserResponse
from app.services.admin_service import AdminService
from app.services.user_service import UserService
from app.utils.response import paginated, success

router = APIRouter()


@router.get("/overview")
def overview(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return success(AdminService(db).overview())


@router.get("/users")
def list_users(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=200),
               search: str | None = None, role: str | None = None, status: str | None = None,
               db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    items, total = UserService(db).list(page, limit, search, role, status)
    data = [UserResponse.model_validate(u).model_dump(mode="json") for u in items]
    return success(paginated(data, page, limit, total))


@router.patch("/users/{user_id}/quota")
def update_quota(user_id: int, payload: QuotaUpdate, db: Session = Depends(get_db),
                 _: User = Depends(get_admin_user)):
    user = UserService(db).update_quota(user_id, payload.quota_bytes)
    return success(UserResponse.model_validate(user).model_dump(mode="json"), "Quota updated")


@router.get("/activity-logs")
def activity_logs(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=200),
                  action: str | None = None, user_id: int | None = None,
                  date_from: datetime | None = None, date_to: datetime | None = None,
                  db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    items, total = AdminService(db).activity_logs(page, limit, action, user_id, date_from, date_to)
    data = [ActivityLogResponse.model_validate(i).model_dump(mode="json") for i in items]
    return success(paginated(data, page, limit, total))


@router.get("/settings")
def get_settings(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return success(AdminService(db).get_settings())


@router.patch("/settings")
def update_settings(payload: SystemSettingsUpdate, db: Session = Depends(get_db),
                    _: User = Depends(get_admin_user)):
    return success(AdminService(db).update_settings(payload), "Settings updated")
