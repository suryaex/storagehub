"""StorageHub FastAPI application entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging
from app.db.init_db import init_db

configure_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("Starting %s v%s (%s)", settings.APP_NAME, settings.APP_VERSION,
                settings.ENVIRONMENT)
    try:
        init_db()
    except Exception:  # pragma: no cover
        logger.exception("Database initialization failed — continuing; check DATABASE_URL")
    yield
    logger.info("Shutting down %s", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Lightweight self-hosted file storage platform.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# SECURITY: refuse to boot in production with the default signing key.
if settings.ENVIRONMENT.lower() in ("production", "prod") and \
        settings.SECRET_KEY in ("", "change-me", "change-me-to-a-long-random-string"):
    raise RuntimeError(
        "SECRET_KEY is unset/default in production — set a strong SECRET_KEY in .env"
    )


@app.middleware("http")
async def _security_headers(request, call_next):
    resp = await call_next(request)
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    resp.headers.setdefault("X-Frame-Options", "DENY")
    resp.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    resp.headers.setdefault("X-XSS-Protection", "0")
    resp.headers.setdefault(
        "Permissions-Policy", "geolocation=(), microphone=(), camera=()"
    )
    if settings.ENABLE_HSTS:
        resp.headers.setdefault(
            "Strict-Transport-Security", "max-age=31536000; includeSubDomains"
        )
    return resp


register_exception_handlers(app)
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {
        "success": True,
        "data": {"service": settings.APP_NAME, "version": settings.APP_VERSION,
                 "docs": "/docs"},
        "message": "StorageHub API",
    }
