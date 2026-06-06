from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.api.deps import client_meta, get_current_user
from app.core.config import settings
from app.exceptions.auth import OAuthError
from app.schemas.auth import LocalLoginRequest, LogoutRequest, RefreshRequest
from app.schemas.user import UserResponse
from app.security import oauth as oauth_provider
from app.security.tokens import generate_state
from app.services.auth_service import AuthService
from app.db.session import get_db
from app.models.user import User
from app.utils.response import success

router = APIRouter()

_STATE_COOKIE = "sh_oauth_state"


@router.get("/providers")
def providers():
    enabled = {p: settings.provider_enabled(p) for p in oauth_provider.SUPPORTED_PROVIDERS}
    enabled["local"] = settings.ALLOW_LOCAL_LOGIN
    return success({"providers": enabled})


@router.get("/callback/{provider}")
async def callback(provider: str, request: Request,
                   code: str = Query(...), state: str = Query(...),
                   db: Session = Depends(get_db)):
    cookie_state = request.cookies.get(_STATE_COOKIE)
    if not cookie_state or cookie_state != state:
        raise OAuthError("Invalid OAuth state")
    profile = await oauth_provider.exchange_code(provider, code)
    service = AuthService(db)
    user = service.provision_from_profile(profile)
    meta = client_meta(request)
    access, refresh, _ = service.issue_tokens(user, meta["ip"], meta["ua"])
    target = f"{settings.FRONTEND_URL.rstrip('/')}/auth/callback#access_token={access}&refresh_token={refresh}"
    resp = RedirectResponse(target, status_code=302)
    resp.delete_cookie(_STATE_COOKIE)
    return resp


@router.post("/local")
def local_login(payload: LocalLoginRequest, request: Request, db: Session = Depends(get_db)):
    """Passwordless development login (guarded by ALLOW_LOCAL_LOGIN)."""
    service = AuthService(db)
    user = service.local_login(payload.email, payload.full_name)
    meta = client_meta(request)
    access, refresh, expires_in = service.issue_tokens(user, meta["ip"], meta["ua"])
    return success({
        "access_token": access, "refresh_token": refresh,
        "token_type": "bearer", "expires_in": expires_in,
    }, "Logged in")


@router.post("/refresh")
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    access, refresh, expires_in = service.refresh_tokens(payload.refresh_token)
    return success({
        "access_token": access, "refresh_token": refresh,
        "token_type": "bearer", "expires_in": expires_in,
    }, "Token refreshed")


@router.post("/logout")
def logout(payload: LogoutRequest, db: Session = Depends(get_db),
           user: User = Depends(get_current_user)):
    AuthService(db).logout(payload.refresh_token)
    return success(None, "Logged out")


@router.get("/me", response_model=None)
def me(user: User = Depends(get_current_user)):
    return success(UserResponse.model_validate(user).model_dump(mode="json"))


# NOTE: keep this catch-all dynamic route LAST so it doesn't shadow /me, /providers, etc.
@router.get("/{provider}")
async def start_login(provider: str, response: Response):
    if provider not in oauth_provider.SUPPORTED_PROVIDERS:
        raise OAuthError(f"Unsupported provider: {provider}")
    state = generate_state()
    url = await oauth_provider.authorization_url(provider, state)
    redirect = RedirectResponse(url, status_code=302)
    redirect.set_cookie(_STATE_COOKIE, state, max_age=600, httponly=True, samesite="lax")
    return redirect
