"""Trash retention window. Reuses the existing system_settings table (same
one the admin /settings screen already edits) so there is no second place
to configure this — falls back to the env default when unset/unparseable.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.repositories.settings_repository import SettingsRepository


def trash_retention_days(db: Session) -> int:
    setting = SettingsRepository(db).get("trash_retention_days")
    if setting and setting.setting_value:
        try:
            return int(setting.setting_value)
        except ValueError:
            pass
    return settings.TRASH_RETENTION_DAYS


def trash_expiry(db: Session) -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=trash_retention_days(db))
