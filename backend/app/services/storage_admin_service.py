"""Admin: storage overview, storage nodes (RAID/type config) and cloud sync targets."""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.config import settings
from app.exceptions.base import Conflict, NotFound, ValidationError
from app.models.cloud_target import CloudTarget
from app.models.storage_node import StorageNode
from app.repositories.cloud_repository import CloudRepository
from app.repositories.node_repository import NodeRepository
from app.services import storage_info_service as sinfo

_NODE_TYPES = {"local", "remote", "s3", "webdav"}
_STORAGE_TYPES = {"auto", "ssd", "hdd", "nvme", "raid"}
_PROVIDERS = {"s3", "webdav", "gdrive", "dropbox"}
_SYNC_MODES = {"backup", "mirror"}


class StorageAdminService:
    def __init__(self, db: Session):
        self.db = db
        self.nodes = NodeRepository(db)
        self.clouds = CloudRepository(db)

    # ── host detection ──
    def overview(self) -> dict:
        host = sinfo.host_overview(settings.STORAGE_ROOT)
        # refresh primary node usage from the live disk
        primary = self.nodes.get_primary()
        if primary and primary.node_type == "local":
            usage = host["usage"]
            primary.capacity_bytes = usage["total_bytes"]
            primary.used_bytes = usage["used_bytes"]
            primary.status = "online"
            self.db.commit()
        return {"host": host, "nodes": [self._node(n) for n in self.nodes.list()]}

    # ── nodes ──
    @staticmethod
    def _node(n: StorageNode) -> dict:
        return {
            "id": n.id, "name": n.name, "node_type": n.node_type, "location": n.location,
            "storage_type": n.storage_type, "raid_level": n.raid_level, "status": n.status,
            "capacity_bytes": n.capacity_bytes, "used_bytes": n.used_bytes,
            "is_primary": n.is_primary, "created_at": n.created_at,
        }

    def list_nodes(self) -> list[dict]:
        return [self._node(n) for n in self.nodes.list()]

    def create_node(self, data) -> dict:  # noqa: ANN001
        if data.node_type not in _NODE_TYPES:
            raise ValidationError("Invalid node_type")
        if data.storage_type not in _STORAGE_TYPES:
            raise ValidationError("Invalid storage_type")
        if self.nodes.get_by_name(data.name):
            raise Conflict("A node with this name already exists")
        node = self.nodes.create(
            name=data.name, node_type=data.node_type, location=data.location,
            storage_type=data.storage_type, raid_level=data.raid_level or "none",
            status="unknown",
        )
        self._refresh_local(node)
        self.db.commit()
        return self._node(node)

    def update_node(self, node_id: int, data) -> dict:  # noqa: ANN001
        node = self.nodes.get(node_id)
        if not node:
            raise NotFound("Node not found")
        if data.name is not None:
            node.name = data.name
        if data.location is not None:
            node.location = data.location
        if data.storage_type is not None:
            if data.storage_type not in _STORAGE_TYPES:
                raise ValidationError("Invalid storage_type")
            node.storage_type = data.storage_type
        if data.raid_level is not None:
            node.raid_level = data.raid_level
        if data.status is not None:
            node.status = data.status
        self._refresh_local(node)
        self.db.commit()
        return self._node(node)

    def set_primary(self, node_id: int) -> dict:
        node = self.nodes.get(node_id)
        if not node:
            raise NotFound("Node not found")
        self.nodes.clear_primary()
        node.is_primary = True
        self.db.commit()
        return self._node(node)

    def delete_node(self, node_id: int) -> None:
        node = self.nodes.get(node_id)
        if not node:
            raise NotFound("Node not found")
        if node.is_primary:
            raise ValidationError("Cannot delete the primary node")
        self.nodes.delete(node)
        self.db.commit()

    def _refresh_local(self, node: StorageNode) -> None:
        if node.node_type == "local":
            usage = sinfo.disk_usage(node.location)
            node.capacity_bytes = usage["total_bytes"]
            node.used_bytes = usage["used_bytes"]
            node.status = "online" if usage["total_bytes"] > 0 else "offline"

    # ── cloud targets ──
    @staticmethod
    def _cloud(c: CloudTarget) -> dict:
        return {
            "id": c.id, "name": c.name, "provider": c.provider, "endpoint": c.endpoint,
            "bucket": c.bucket, "access_key": c.access_key, "sync_mode": c.sync_mode,
            "enabled": c.enabled, "status": c.status, "last_sync_at": c.last_sync_at,
            "created_at": c.created_at,
        }

    def list_clouds(self) -> list[dict]:
        return [self._cloud(c) for c in self.clouds.list()]

    def create_cloud(self, data) -> dict:  # noqa: ANN001
        if data.provider not in _PROVIDERS:
            raise ValidationError("Invalid provider")
        if data.sync_mode not in _SYNC_MODES:
            raise ValidationError("Invalid sync_mode")
        if self.clouds.get_by_name(data.name):
            raise Conflict("A cloud target with this name already exists")
        target = self.clouds.create(
            name=data.name, provider=data.provider, endpoint=data.endpoint,
            bucket=data.bucket, access_key=data.access_key, secret_key=data.secret_key,
            sync_mode=data.sync_mode, enabled=data.enabled, status="idle",
        )
        self.db.commit()
        return self._cloud(target)

    def update_cloud(self, target_id: int, data) -> dict:  # noqa: ANN001
        c = self.clouds.get(target_id)
        if not c:
            raise NotFound("Cloud target not found")
        for field in ("name", "endpoint", "bucket", "access_key", "secret_key", "sync_mode", "enabled"):
            val = getattr(data, field, None)
            if val is not None:
                setattr(c, field, val)
        self.db.commit()
        return self._cloud(c)

    def delete_cloud(self, target_id: int) -> None:
        c = self.clouds.get(target_id)
        if not c:
            raise NotFound("Cloud target not found")
        self.clouds.delete(c)
        self.db.commit()
