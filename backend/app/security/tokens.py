"""Secure random token generation."""
from __future__ import annotations

import secrets


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def generate_share_token() -> str:
    return secrets.token_urlsafe(24)


def generate_state() -> str:
    return secrets.token_urlsafe(24)
