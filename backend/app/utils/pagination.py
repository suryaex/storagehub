"""Pagination query parameters."""
from __future__ import annotations

from fastapi import Query
from pydantic import BaseModel


class PageParams(BaseModel):
    page: int = 1
    limit: int = 20
    sort: str | None = None
    order: str = "desc"

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit


def page_params(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    sort: str | None = Query(None),
    order: str = Query("desc", pattern="^(asc|desc)$"),
) -> PageParams:
    return PageParams(page=page, limit=limit, sort=sort, order=order)
