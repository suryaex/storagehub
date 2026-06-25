"""Aggregates all v1 routers."""
from fastapi import APIRouter

from app.api.v1 import (
    admin,
    auth,
    dashboard,
    files,
    folders,
    health,
    ingest,
    search,
    shares,
    storage,
    trash,
    update,
    uploads,
    users,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(ingest.router, prefix="/ingest", tags=["ingest"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(folders.router, prefix="/folders", tags=["folders"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(shares.router, tags=["shares"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(storage.router, prefix="/admin", tags=["admin"])
api_router.include_router(trash.router, prefix="/trash", tags=["trash"])
api_router.include_router(update.router, prefix="/update", tags=["update"])
