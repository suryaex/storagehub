"""Authentication & user provisioning."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants import ACTION_LOGIN, RESOURCE_USER, ROOT_FOLDER_NAME
from app.exceptions.auth import InvalidToken, UserDisabled
from app.models.user import User
from app.repositories.activity_log_repository import ActivityLogRepository
from app.repositories.folder_repository import FolderRepository
from app.repositories.oauth_repository import OAuthRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.security.hashes import sha256_hex
from app.security.jwt import create_access_token
from app.security.oauth import OAuthProfile
from app.security.tokens import generate_refresh_token


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)
        self.oauth = OAuthRepository(db)
        self.folders = FolderRepository(db)
        self.refresh = RefreshTokenRepository(db)
        self.logs = ActivityLogRepository(db)

    # ── provisioning ──
    def provision_from_profile(self, profile: OAuthProfile) -> User:
        account = self.oauth.get_by_subject(profile.provider, profile.subject)
        if account:
            return self.users.get(account.user_id)

        user = None
        if profile.email:
            user = self.users.get_by_email(profile.email)
        if not user:
            user = self._create_user(profile.email or f"{profile.subject}@{profile.provider}.local",
                                     profile.full_name, profile.avatar_url)
        self.oauth.create(
            user_id=user.id,
            provider=profile.provider,
            provider_subject=profile.subject,
            provider_email=profile.email,
        )
        return user

    def local_login(self, email: str, full_name: str | None) -> User:
        if not settings.ALLOW_LOCAL_LOGIN:
            raise InvalidToken("Local login is disabled")
        user = self.users.get_by_email(email)
        if not user:
            user = self._create_user(email, full_name or email.split("@")[0], None)
            self.oauth.create(
                user_id=user.id, provider="local",
                provider_subject=email, provider_email=email,
            )
        return user

    def _create_user(self, email: str, full_name: str, avatar_url: str | None) -> User:
        is_first = self.users.count() == 0
        user = self.users.create(
            email=email,
            full_name=full_name,
            avatar_url=avatar_url,
            role="admin" if is_first else "user",
            status="active",
            quota_bytes=settings.DEFAULT_USER_QUOTA,
            used_bytes=0,
        )
        # root folder
        self.folders.create(
            owner_id=user.id, parent_id=None, name=ROOT_FOLDER_NAME, path="/",
        )
        return user

    # ── tokens ──
    def issue_tokens(self, user: User, ip: str | None = None, ua: str | None = None) -> tuple[str, str, int]:
        if user.status == "disabled":
            raise UserDisabled("Account is disabled")
        access = create_access_token(user.id, {"role": user.role})
        raw_refresh = generate_refresh_token()
        self.refresh.create(
            user_id=user.id,
            token_hash=sha256_hex(raw_refresh),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        user.last_login_at = datetime.now(timezone.utc)
        self.logs.create(user_id=user.id, action=ACTION_LOGIN, resource_type=RESOURCE_USER,
                         resource_id=user.id, ip_address=ip, user_agent=ua)
        self.db.commit()
        return access, raw_refresh, settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    def refresh_tokens(self, raw_refresh: str) -> tuple[str, str, int]:
        record = self.refresh.get_by_hash(sha256_hex(raw_refresh))
        if not record or not self.refresh.is_valid(record):
            raise InvalidToken("Invalid or expired refresh token")
        user = self.users.get(record.user_id)
        if not user or user.status == "disabled":
            raise UserDisabled("Account is disabled")
        # rotate
        self.refresh.revoke(record)
        access = create_access_token(user.id, {"role": user.role})
        new_refresh = generate_refresh_token()
        self.refresh.create(
            user_id=user.id,
            token_hash=sha256_hex(new_refresh),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        self.db.commit()
        return access, new_refresh, settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    def logout(self, raw_refresh: str | None) -> None:
        if not raw_refresh:
            return
        record = self.refresh.get_by_hash(sha256_hex(raw_refresh))
        if record:
            self.refresh.revoke(record)
            self.db.commit()
