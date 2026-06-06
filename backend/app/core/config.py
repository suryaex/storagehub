"""Application configuration loaded from environment variables."""
from __future__ import annotations

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    APP_NAME: str = "StorageHub"
    APP_VERSION: str = "1.0"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change-me"
    CORS_ORIGINS: str = "http://localhost,http://localhost:5173,http://localhost:3000"

    # URLs
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"
    API_V1_PREFIX: str = "/api/v1"

    # Auth
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALLOW_LOCAL_LOGIN: bool = True

    # Database
    DATABASE_URL: str = "mysql+pymysql://storagehub:storagehub@localhost:3306/storagehub"

    # Storage
    STORAGE_ROOT: str = "./storage"
    DEFAULT_USER_QUOTA: int = 10_737_418_240  # 10 GiB
    MAX_UPLOAD_SIZE: int = 53_687_091_200  # 50 GiB
    UPLOAD_CHUNK_SIZE: int = 8_388_608  # 8 MiB
    TRASH_RETENTION_DAYS: int = 30

    # OAuth providers
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    MICROSOFT_CLIENT_ID: str = ""
    MICROSOFT_CLIENT_SECRET: str = ""
    MICROSOFT_TENANT: str = "common"
    OIDC_CLIENT_ID: str = ""
    OIDC_CLIENT_SECRET: str = ""
    OIDC_DISCOVERY_URL: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @field_validator("ALLOW_LOCAL_LOGIN", mode="before")
    @classmethod
    def _parse_bool(cls, v):  # noqa: ANN001
        if isinstance(v, str):
            return v.strip().lower() in {"1", "true", "yes", "on"}
        return v

    def provider_enabled(self, provider: str) -> bool:
        mapping = {
            "google": bool(self.GOOGLE_CLIENT_ID and self.GOOGLE_CLIENT_SECRET),
            "github": bool(self.GITHUB_CLIENT_ID and self.GITHUB_CLIENT_SECRET),
            "microsoft": bool(self.MICROSOFT_CLIENT_ID and self.MICROSOFT_CLIENT_SECRET),
            "oidc": bool(self.OIDC_CLIENT_ID and self.OIDC_CLIENT_SECRET and self.OIDC_DISCOVERY_URL),
        }
        return mapping.get(provider, False)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
