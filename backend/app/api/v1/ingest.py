"""Service-to-service log ingest (e.g. SecureOps backups).

Authenticated with a shared service key in the `X-API-Key` header — NOT the
user OAuth/JWT system. Stores uploaded archives under
`STORAGE_ROOT/backups/<source>/<YYYYMMDD>/<filename>` with strict path-traversal
protection. Intended for ARM boards / microcontrollers / network appliances
whose logs SecureOps collects and ships here for safekeeping.
"""
from __future__ import annotations

import hmac
import re
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile, status

from app.core.config import settings

router = APIRouter()

_SAFE = re.compile(r"[^A-Za-z0-9._-]")
_MAX_BYTES = 256 * 1024 * 1024  # 256 MiB per backup archive


def _require_service_key(x_api_key: str | None) -> None:
    keys = settings.service_api_keys_list
    if not keys:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ingest disabled: no SERVICE_API_KEYS configured",
        )
    presented = (x_api_key or "").strip()
    # constant-time compare against every configured key
    if not presented or not any(hmac.compare_digest(presented, k) for k in keys):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid service API key",
        )


def _sanitize(value: str, fallback: str) -> str:
    value = (value or "").strip().replace("\\", "/").split("/")[-1]  # drop any path
    value = _SAFE.sub("_", value)
    value = value.strip("._") or fallback
    return value[:120]


@router.post("/logs", status_code=201)
async def ingest_logs(
    file: UploadFile = File(...),
    source: str = Form("unknown"),
    x_api_key: str | None = Header(None),
):
    _require_service_key(x_api_key)

    safe_source = _sanitize(source, "unknown")
    safe_name = _sanitize(file.filename or "", "backup.bin")

    root = Path(settings.STORAGE_ROOT).resolve()
    day = datetime.now(timezone.utc).strftime("%Y%m%d")
    target_dir = (root / "backups" / safe_source / day).resolve()
    # Defense-in-depth: ensure the resolved dir is still inside STORAGE_ROOT.
    if not str(target_dir).startswith(str(root)):
        raise HTTPException(status_code=400, detail="Invalid storage path")
    target_dir.mkdir(parents=True, exist_ok=True)

    dest = target_dir / safe_name
    if dest.exists():
        stamp = datetime.now(timezone.utc).strftime("%H%M%S")
        dest = target_dir / f"{dest.stem}-{stamp}{dest.suffix}"

    size = 0
    try:
        with open(dest, "wb") as fh:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > _MAX_BYTES:
                    fh.close()
                    dest.unlink(missing_ok=True)
                    raise HTTPException(status_code=413, detail="Archive too large")
                fh.write(chunk)
    finally:
        await file.close()

    rel = dest.relative_to(root).as_posix()
    return {
        "success": True,
        "data": {"path": rel, "size": size, "source": safe_source},
        "message": "stored",
    }
