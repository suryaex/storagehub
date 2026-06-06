"""Detect host storage: capacity, media type (SSD/HDD/NVMe), filesystem, RAID.

Pure stdlib. Rich detection on Linux (via /proc and /sys); on other platforms it
falls back to capacity only with type 'unknown'.
"""
from __future__ import annotations

import os
import platform
import re
import shutil
from pathlib import Path

SYS_BLOCK = "/sys/block"


def disk_usage(path: str | os.PathLike) -> dict:
    try:
        u = shutil.disk_usage(path)
        return {"total_bytes": u.total, "used_bytes": u.used, "free_bytes": u.free}
    except OSError:
        return {"total_bytes": 0, "used_bytes": 0, "free_bytes": 0}


def _mount_device(path: str) -> tuple[str, str, str] | None:
    """Return (device, mountpoint, fstype) for the filesystem holding ``path`` (Linux)."""
    try:
        real = os.path.realpath(path)
        best: tuple[str, str, str] | None = None
        with open("/proc/mounts", encoding="utf-8") as f:
            for line in f:
                parts = line.split()
                if len(parts) < 3:
                    continue
                dev, mnt, fstype = parts[0], parts[1], parts[2]
                if real == mnt or real.startswith(mnt.rstrip("/") + "/") or mnt == "/":
                    if best is None or len(mnt) > len(best[1]):
                        best = (dev, mnt, fstype)
        return best
    except OSError:
        return None


def _base_block(device: str) -> str | None:
    name = os.path.basename(device)
    if not name:
        return None
    if name.startswith("nvme"):
        return re.sub(r"p?\d+$", "", name)  # nvme0n1p2 -> nvme0n1
    if name.startswith("md"):
        return name
    return re.sub(r"\d+$", "", name)  # sda1 -> sda


def media_type(path: str) -> dict:
    info: dict = {"type": "unknown", "rotational": None, "model": None, "block": None}
    dev = _mount_device(path)
    if not dev:
        return info
    base = _base_block(dev[0])
    info["block"] = base
    if not base:
        return info
    if base.startswith("md"):
        info["type"] = "RAID"
        return info
    if base.startswith("nvme"):
        info["type"] = "NVMe SSD"
        info["rotational"] = 0
    else:
        try:
            rot = int(Path(f"{SYS_BLOCK}/{base}/queue/rotational").read_text().strip())
            info["rotational"] = rot
            info["type"] = "HDD" if rot == 1 else "SSD"
        except (OSError, ValueError):
            pass
    try:
        info["model"] = Path(f"{SYS_BLOCK}/{base}/device/model").read_text().strip()
    except OSError:
        pass
    return info


def raid_status() -> list[dict]:
    arrays: list[dict] = []
    try:
        text = Path("/proc/mdstat").read_text(encoding="utf-8")
    except OSError:
        return arrays
    for line in text.splitlines():
        m = re.match(r"(md\d+)\s*:\s*(\w+)\s+(raid\d+)\s+(.*)", line)
        if m:
            arrays.append({
                "name": m.group(1),
                "state": m.group(2),
                "level": m.group(3),
                "members": re.findall(r"([\w-]+)\[\d+\]", m.group(4)),
            })
    return arrays


def host_overview(storage_root: str) -> dict:
    dev = _mount_device(storage_root)
    return {
        "platform": platform.system(),
        "storage_root": str(storage_root),
        "device": dev[0] if dev else None,
        "mount": dev[1] if dev else None,
        "filesystem": dev[2] if dev else None,
        "media": media_type(storage_root),
        "usage": disk_usage(storage_root),
        "raid": raid_status(),
    }
