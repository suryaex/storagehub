from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.trash_service import TrashService
from app.utils.response import success

router = APIRouter()


@router.get("")
def list_trash(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return success(TrashService(db).list(user.id))


@router.post("/{trash_id}/restore")
def restore(trash_id: int, db: Session = Depends(get_db),
            user: User = Depends(get_current_user)):
    TrashService(db).restore(trash_id, user.id)
    return success(None, "Item restored")


@router.delete("/{trash_id}/permanent")
def permanent_delete(trash_id: int, db: Session = Depends(get_db),
                     user: User = Depends(get_current_user)):
    TrashService(db).permanent_delete(trash_id, user.id)
    return success(None, "Item permanently deleted")
