"""Filename / path helpers."""
from __future__ import annotations

import os
import re

_INVALID = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


def sanitize_filename(name: str) -> str:
    name = name.strip().replace("\n", " ").replace("\r", " ")
    name = _INVALID.sub("_", name)
    name = name.strip(". ")
    return name[:255] or "untitled"


def split_extension(filename: str) -> str | None:
    _, ext = os.path.splitext(filename)
    return ext.lstrip(".").lower() or None


def humanize_bytes(num: int) -> str:
    for unit in ("B", "KB", "MB", "GB", "TB", "PB"):
        if abs(num) < 1024.0:
            return f"{num:3.1f} {unit}"
        num /= 1024.0
    return f"{num:.1f} EB"
