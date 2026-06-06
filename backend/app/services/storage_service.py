"""Local filesystem storage layer.

Layout under STORAGE_ROOT:
    users/<user_id>/<file_id>__<filename>   final stored files
    temp/<session_id>/<chunk_index>          chunk parts during upload
    trash/<user_id>/...                      reserved for trashed blobs
"""
from __future__ import annotations

import os
import shutil
from pathlib import Path

from app.core.config import settings


class StorageService:
    def __init__(self, root: str | None = None):
        self.root = Path(root or settings.STORAGE_ROOT).resolve()
        for sub in ("users", "shared", "trash", "temp"):
            (self.root / sub).mkdir(parents=True, exist_ok=True)

    # ── paths ──
    def user_dir(self, user_id: int) -> Path:
        p = self.root / "users" / str(user_id)
        p.mkdir(parents=True, exist_ok=True)
        return p

    def temp_dir(self, session_id: int) -> Path:
        p = self.root / "temp" / str(session_id)
        p.mkdir(parents=True, exist_ok=True)
        return p

    def file_path(self, user_id: int, file_id: int, filename: str) -> Path:
        safe = filename.replace("/", "_").replace("\\", "_")
        return self.user_dir(user_id) / f"{file_id}__{safe}"

    def relative(self, path: Path) -> str:
        try:
            return str(Path(path).resolve().relative_to(self.root))
        except ValueError:
            return str(path)

    def absolute(self, relative_path: str) -> Path:
        return (self.root / relative_path).resolve()

    # ── chunk operations ──
    def chunk_path(self, session_id: int, chunk_index: int) -> Path:
        return self.temp_dir(session_id) / f"{chunk_index}.part"

    def write_chunk(self, session_id: int, chunk_index: int, data: bytes) -> Path:
        path = self.chunk_path(session_id, chunk_index)
        with open(path, "wb") as f:
            f.write(data)
        return path

    def merge_chunks(self, session_id: int, total_chunks: int, dest: Path) -> None:
        dest.parent.mkdir(parents=True, exist_ok=True)
        with open(dest, "wb") as out:
            for idx in range(total_chunks):
                part = self.chunk_path(session_id, idx)
                with open(part, "rb") as pf:
                    shutil.copyfileobj(pf, out)

    def cleanup_session(self, session_id: int) -> None:
        temp = self.root / "temp" / str(session_id)
        if temp.exists():
            shutil.rmtree(temp, ignore_errors=True)

    # ── file operations ──
    def save_bytes(self, dest: Path, data: bytes) -> None:
        dest.parent.mkdir(parents=True, exist_ok=True)
        with open(dest, "wb") as f:
            f.write(data)

    def save_stream(self, dest: Path, src_file) -> int:  # noqa: ANN001
        dest.parent.mkdir(parents=True, exist_ok=True)
        size = 0
        with open(dest, "wb") as out:
            while True:
                buf = src_file.read(1024 * 1024)
                if not buf:
                    break
                out.write(buf)
                size += len(buf)
        return size

    def delete(self, relative_path: str) -> None:
        path = self.absolute(relative_path)
        if path.exists() and path.is_file():
            try:
                path.unlink()
            except OSError:
                pass

    def copy(self, relative_src: str, dest: Path) -> None:
        src = self.absolute(relative_src)
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)

    def exists(self, relative_path: str) -> bool:
        return self.absolute(relative_path).exists()

    def disk_free_bytes(self) -> int:
        try:
            return shutil.disk_usage(self.root).free
        except OSError:
            return 0


storage = StorageService()
