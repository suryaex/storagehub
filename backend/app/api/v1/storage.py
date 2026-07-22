from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.storage import (
    CloudTargetCreate,
    CloudTargetUpdate,
    RaidConfigRequest,
    StorageNodeCreate,
    StorageNodeCreateSimple,
    StorageNodeUpdate,
)
from app.services.storage_admin_service import StorageAdminService
from app.utils.response import success

# Preset cloud provider configurations
CLOUD_PRESETS = {
    "aws-s3": {
        "provider": "s3",
        "endpoint": "https://s3.amazonaws.com",
        "name_hint": "AWS S3",
    },
    "backblaze": {
        "provider": "s3",
        "endpoint": "https://s3.{region}.backblazeb2.com",
        "name_hint": "Backblaze B2",
    },
    "minio": {
        "provider": "s3",
        "endpoint": "",
        "name_hint": "MinIO",
    },
    "wasabi": {
        "provider": "s3",
        "endpoint": "https://s3.wasabisys.com",
        "name_hint": "Wasabi",
    },
    "webdav": {
        "provider": "webdav",
        "endpoint": "",
        "name_hint": "WebDAV",
    },
}

router = APIRouter()


# ── Storage overview (hardware detection) ──
@router.get("/storage")
def storage_overview(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return success(StorageAdminService(db).overview())


# ── Storage nodes ──
@router.get("/nodes")
def list_nodes(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return success(StorageAdminService(db).list_nodes())


@router.post("/nodes")
def create_node(payload: StorageNodeCreate, db: Session = Depends(get_db),
                _: User = Depends(get_admin_user)):
    return success(StorageAdminService(db).create_node(payload), "Node added")


@router.post("/nodes/simple")
def create_node_simple(payload: StorageNodeCreateSimple, db: Session = Depends(get_db),
                       _: User = Depends(get_admin_user)):
    """Simple node creation - auto-detects location for local nodes."""
    return success(StorageAdminService(db).create_node_simple(payload), "Node added")


@router.get("/cloud-presets")
def cloud_presets():
    """Return available cloud provider presets."""
    return success(CLOUD_PRESETS)


@router.patch("/nodes/{node_id}")
def update_node(node_id: int, payload: StorageNodeUpdate, db: Session = Depends(get_db),
                _: User = Depends(get_admin_user)):
    return success(StorageAdminService(db).update_node(node_id, payload), "Node updated")


@router.post("/nodes/{node_id}/primary")
def set_primary(node_id: int, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return success(StorageAdminService(db).set_primary(node_id), "Primary node set")


@router.post("/nodes/{node_id}/raid")
def configure_raid(node_id: int, payload: RaidConfigRequest, db: Session = Depends(get_db),
                   _: User = Depends(get_admin_user)):
    result = StorageAdminService(db).configure_raid(node_id, payload.raid_level, payload.devices)
    return success(result, "RAID configuration saved")


@router.delete("/nodes/{node_id}")
def delete_node(node_id: int, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    StorageAdminService(db).delete_node(node_id)
    return success(None, "Node removed")


# ── Cloud sync targets ──
@router.get("/cloud-targets")
def list_clouds(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    return success(StorageAdminService(db).list_clouds())


@router.post("/cloud-targets")
def create_cloud(payload: CloudTargetCreate, db: Session = Depends(get_db),
                 _: User = Depends(get_admin_user)):
    return success(StorageAdminService(db).create_cloud(payload), "Cloud target added")


@router.patch("/cloud-targets/{target_id}")
def update_cloud(target_id: int, payload: CloudTargetUpdate, db: Session = Depends(get_db),
                 _: User = Depends(get_admin_user)):
    return success(StorageAdminService(db).update_cloud(target_id, payload), "Cloud target updated")


@router.delete("/cloud-targets/{target_id}")
def delete_cloud(target_id: int, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    StorageAdminService(db).delete_cloud(target_id)
    return success(None, "Cloud target removed")
