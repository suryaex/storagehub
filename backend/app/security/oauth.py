"""OAuth2 / OIDC provider handlers.

Implements the authorization-code flow for Google, GitHub, Microsoft and a generic
OIDC provider. Each provider returns a normalized ``OAuthProfile``.
"""
from __future__ import annotations

from dataclasses import dataclass

import httpx

from app.core.config import settings
from app.exceptions.auth import OAuthError

SUPPORTED_PROVIDERS = ("google", "github", "microsoft", "oidc")


@dataclass
class OAuthProfile:
    provider: str
    subject: str
    email: str | None
    full_name: str
    avatar_url: str | None


def redirect_uri(provider: str) -> str:
    return f"{settings.BACKEND_URL}{settings.API_V1_PREFIX}/auth/callback/{provider}"


def _microsoft_base() -> str:
    return f"https://login.microsoftonline.com/{settings.MICROSOFT_TENANT}/oauth2/v2.0"


async def _oidc_config() -> dict:
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(settings.OIDC_DISCOVERY_URL)
        resp.raise_for_status()
        return resp.json()


async def authorization_url(provider: str, state: str) -> str:
    if provider not in SUPPORTED_PROVIDERS:
        raise OAuthError(f"Unsupported provider: {provider}")
    if not settings.provider_enabled(provider):
        raise OAuthError(f"Provider '{provider}' is not configured")

    redirect = redirect_uri(provider)

    if provider == "google":
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": redirect,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
        }
        return "https://accounts.google.com/o/oauth2/v2/auth?" + httpx.QueryParams(params).__str__()

    if provider == "github":
        params = {
            "client_id": settings.GITHUB_CLIENT_ID,
            "redirect_uri": redirect,
            "scope": "read:user user:email",
            "state": state,
        }
        return "https://github.com/login/oauth/authorize?" + httpx.QueryParams(params).__str__()

    if provider == "microsoft":
        params = {
            "client_id": settings.MICROSOFT_CLIENT_ID,
            "redirect_uri": redirect,
            "response_type": "code",
            "scope": "openid email profile User.Read",
            "state": state,
        }
        return f"{_microsoft_base()}/authorize?" + httpx.QueryParams(params).__str__()

    # generic OIDC
    config = await _oidc_config()
    params = {
        "client_id": settings.OIDC_CLIENT_ID,
        "redirect_uri": redirect,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
    }
    return f"{config['authorization_endpoint']}?" + httpx.QueryParams(params).__str__()


async def exchange_code(provider: str, code: str) -> OAuthProfile:
    if provider == "google":
        return await _google(code)
    if provider == "github":
        return await _github(code)
    if provider == "microsoft":
        return await _microsoft(code)
    if provider == "oidc":
        return await _oidc(code)
    raise OAuthError(f"Unsupported provider: {provider}")


async def _google(code: str) -> OAuthProfile:
    async with httpx.AsyncClient(timeout=20) as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri("google"),
                "grant_type": "authorization_code",
            },
        )
        token_resp.raise_for_status()
        access_token = token_resp.json().get("access_token")
        info = await client.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        info.raise_for_status()
        data = info.json()
    return OAuthProfile(
        provider="google",
        subject=data["sub"],
        email=data.get("email"),
        full_name=data.get("name") or data.get("email", "User"),
        avatar_url=data.get("picture"),
    )


async def _github(code: str) -> OAuthProfile:
    async with httpx.AsyncClient(timeout=20) as client:
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "code": code,
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "redirect_uri": redirect_uri("github"),
            },
        )
        token_resp.raise_for_status()
        access_token = token_resp.json().get("access_token")
        headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}
        user = (await client.get("https://api.github.com/user", headers=headers)).json()
        email = user.get("email")
        if not email:
            emails = (await client.get("https://api.github.com/user/emails", headers=headers)).json()
            primary = next((e for e in emails if e.get("primary")), None)
            email = primary["email"] if primary else (emails[0]["email"] if emails else None)
    return OAuthProfile(
        provider="github",
        subject=str(user["id"]),
        email=email,
        full_name=user.get("name") or user.get("login", "User"),
        avatar_url=user.get("avatar_url"),
    )


async def _microsoft(code: str) -> OAuthProfile:
    async with httpx.AsyncClient(timeout=20) as client:
        token_resp = await client.post(
            f"{_microsoft_base()}/token",
            data={
                "code": code,
                "client_id": settings.MICROSOFT_CLIENT_ID,
                "client_secret": settings.MICROSOFT_CLIENT_SECRET,
                "redirect_uri": redirect_uri("microsoft"),
                "grant_type": "authorization_code",
                "scope": "openid email profile User.Read",
            },
        )
        token_resp.raise_for_status()
        access_token = token_resp.json().get("access_token")
        info = await client.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        info.raise_for_status()
        data = info.json()
    email = data.get("mail") or data.get("userPrincipalName")
    return OAuthProfile(
        provider="microsoft",
        subject=data["id"],
        email=email,
        full_name=data.get("displayName") or email or "User",
        avatar_url=None,
    )


async def _oidc(code: str) -> OAuthProfile:
    config = await _oidc_config()
    async with httpx.AsyncClient(timeout=20) as client:
        token_resp = await client.post(
            config["token_endpoint"],
            data={
                "code": code,
                "client_id": settings.OIDC_CLIENT_ID,
                "client_secret": settings.OIDC_CLIENT_SECRET,
                "redirect_uri": redirect_uri("oidc"),
                "grant_type": "authorization_code",
            },
        )
        token_resp.raise_for_status()
        access_token = token_resp.json().get("access_token")
        info = await client.get(
            config["userinfo_endpoint"],
            headers={"Authorization": f"Bearer {access_token}"},
        )
        info.raise_for_status()
        data = info.json()
    return OAuthProfile(
        provider="oidc",
        subject=data.get("sub"),
        email=data.get("email"),
        full_name=data.get("name") or data.get("preferred_username") or data.get("email", "User"),
        avatar_url=data.get("picture"),
    )
