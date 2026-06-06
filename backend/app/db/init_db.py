"""Database initialization — create tables and seed baseline settings."""
from __future__ import annotations

import logging

from sqlalchemy import select

from app.core.config import settings as app_settings
from app.core.constants import DEFAULT_SETTINGS
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.quota_policy import QuotaPolicy
from app.models.storage_node import StorageNode
from app.models.system_setting import SystemSetting
from app.services import storage_info_service as sinfo

# Import models package so all tables register on Base.metadata
import app.models  # noqa: F401

logger = logging.getLogger(__name__)


def create_tables() -> None:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ensured")


def seed_defaults() -> None:
    db = SessionLocal()
    try:
        for key, (value, vtype) in DEFAULT_SETTINGS.items():
            exists = db.scalar(select(SystemSetting).where(SystemSetting.setting_key == key))
            if not exists:
                db.add(SystemSetting(setting_key=key, setting_value=value, value_type=vtype))
        default_policy = db.scalar(select(QuotaPolicy).where(QuotaPolicy.is_default.is_(True)))
        if not default_policy:
            db.add(QuotaPolicy(name="Default User Quota", quota_bytes=10_737_418_240,
                               applies_to_role="user", is_default=True))
        # Primary local storage node
        if not db.scalar(select(StorageNode).where(StorageNode.is_primary.is_(True))):
            usage = sinfo.disk_usage(app_settings.STORAGE_ROOT)
            db.add(StorageNode(
                name="Primary (local)", node_type="local", location=str(app_settings.STORAGE_ROOT),
                storage_type="auto", raid_level="none", status="online",
                capacity_bytes=usage["total_bytes"], used_bytes=usage["used_bytes"],
                is_primary=True,
            ))
        db.commit()
        logger.info("Default settings seeded")
    except Exception:
        db.rollback()
        logger.exception("Failed to seed defaults")
    finally:
        db.close()


def init_db() -> None:
    create_tables()
    seed_defaults()
