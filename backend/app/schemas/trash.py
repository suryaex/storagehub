from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TrashItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item_type: str
    item_id: int
    name: str | None = None
    original_path: str
    deleted_at: datetime
    expires_at: datetime | None = None
