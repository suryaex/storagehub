from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user, get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.activity_log_repository import ActivityLogRepository
from app.schemas.admin import ActivityLogResponse
from app.schemas.user import ProfileUpdate, UserResponse, UserUpdate
from app.services.user_service import UserService
from app.utils.response import paginated, success

router = APIRouter()


def _ser(u: User) -> dict:
    return UserResponse.model_validate(u).model_dump(mode="json")


@router.get("/me")
def my_profile(user: User = Depends(get_current_user)):
    return success(_ser(user))


@router.patch("/me")
def update_my_profile(payload: ProfileUpdate, db: Session = Depends(get_db),
                      user: User = Depends(get_current_user)):
    updated = UserService(db).update_profile(user.id, payload.full_name)
    return success(_ser(updated), "Profile updated")


@router.get("/me/activity-logs")
def my_activity_logs(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=200),
                     action: str | None = None, date_from: datetime | None = None,
                     date_to: datetime | None = None, db: Session = Depends(get_db),
                     user: User = Depends(get_current_user)):
    """A user's own activity log. user_id is forced to the authenticated
    caller server-side (never taken from the client) — that's the whole
    IDOR guard, see tests/test_activity_log.py::test_own_log_scoped_to_self."""
    items, total = ActivityLogRepository(db).list(page, limit, action, user.id, date_from, date_to)
    data = [ActivityLogResponse.model_validate(i).model_dump(mode="json") for i in items]
    return success(paginated(data, page, limit, total))


@router.get("")
def list_users(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=200),
               search: str | None = None, role: str | None = None, status: str | None = None,
               db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    items, total = UserService(db).list(page, limit, search, role, status)
    return success(paginated([_ser(u) for u in items], page, limit, total))


@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return success(_ser(UserService(db).get(user_id)))


@router.patch("/{user_id}")
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db),
                admin: User = Depends(get_admin_user)):
    return success(_ser(UserService(db).update(admin.id, user_id, payload)), "User updated")


@router.post("/{user_id}/disable")
def disable_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return success(_ser(UserService(db).set_status(user_id, "disabled")), "User disabled")


@router.post("/{user_id}/enable")
def enable_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return success(_ser(UserService(db).set_status(user_id, "active")), "User enabled")


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    UserService(db).soft_delete(user_id)
    return success(None, "User deleted")
