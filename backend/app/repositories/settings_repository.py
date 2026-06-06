from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.system_setting import SystemSetting


class SettingsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, key: str) -> SystemSetting | None:
        return self.db.scalar(select(SystemSetting).where(SystemSetting.setting_key == key))

    def all(self) -> list[SystemSetting]:
        return list(self.db.scalars(select(SystemSetting)).all())

    def upsert(self, key: str, value: str, value_type: str = "string") -> SystemSetting:
        setting = self.get(key)
        if setting:
            setting.setting_value = value
            setting.value_type = value_type
        else:
            setting = SystemSetting(setting_key=key, setting_value=value, value_type=value_type)
            self.db.add(setting)
        self.db.flush()
        return setting
