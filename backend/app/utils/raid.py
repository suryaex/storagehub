"""RAID level helpers — validation and mdadm command generation.

The app does NOT execute destructive RAID operations itself. It validates the
chosen level/devices and returns the exact `mdadm` command to run on the node
(via scripts/setup-raid.sh), then stores the declared configuration.
"""
from __future__ import annotations

# raid_level -> (mdadm level value, minimum devices, requires even count)
RAID_LEVELS: dict[str, tuple[str, int, bool]] = {
    "none": ("", 1, False),
    "linear": ("linear", 2, False),
    "raid0": ("0", 2, False),
    "raid1": ("1", 2, False),
    "raid5": ("5", 3, False),
    "raid6": ("6", 4, False),
    "raid10": ("10", 4, True),
}


def validate(level: str, devices: list[str]) -> None:
    if level not in RAID_LEVELS:
        raise ValueError(f"Unsupported RAID level: {level}")
    if level == "none":
        return
    _, min_dev, even = RAID_LEVELS[level]
    n = len([d for d in devices if d.strip()])
    if n < min_dev:
        raise ValueError(f"{level} needs at least {min_dev} devices (got {n})")
    if even and n % 2 != 0:
        raise ValueError(f"{level} needs an even number of devices (got {n})")


def mdadm_command(level: str, devices: list[str], array: str = "/dev/md0") -> str:
    devs = [d.strip() for d in devices if d.strip()]
    if level == "none" or not devs:
        return ""
    mlevel = RAID_LEVELS[level][0]
    return (
        f"sudo mdadm --create {array} --level={mlevel} "
        f"--raid-devices={len(devs)} {' '.join(devs)}"
    )
