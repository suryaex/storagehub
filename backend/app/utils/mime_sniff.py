"""Server-side content sniffing for the inline-preview allowlist.

Never trust the client-supplied MIME type or filename extension for a
decision that controls whether a response is rendered *inline* in a
browser — both are attacker-controlled at upload time. Sniff the real
bytes on disk and match against a fixed allowlist instead. Anything else
(including SVG/HTML, which are script vectors) falls through to `None`;
the caller must then refuse inline preview.
"""
from __future__ import annotations

from pathlib import Path

from app.core.constants import MAX_PREVIEW_TEXT_BYTES

# ponytail: hand-rolled magic-byte sniff instead of adding python-magic
# (new native dependency, breaks the "no x86-only native deps" ARM rule
# risk). stdlib's `imghdr` was removed in Python 3.13, and the allowlist is
# only 4 image formats + pdf + 3 video containers, so a handful of
# signature checks is the smallest correct fix.

_IMAGE_SIGNATURES: tuple[tuple[bytes, str], ...] = (
    (b"\x89PNG\r\n\x1a\n", "image/png"),
    (b"\xff\xd8\xff", "image/jpeg"),
    (b"GIF87a", "image/gif"),
    (b"GIF89a", "image/gif"),
)

_MARKUP_PREFIXES = (b"<?xml", b"<svg", b"<!doctype html", b"<html")


def _is_webp(head: bytes) -> bool:
    return head[:4] == b"RIFF" and head[8:12] == b"WEBP"


def _is_mp4(head: bytes) -> bool:
    return head[4:8] == b"ftyp"


def _is_markup(sample: bytes) -> bool:
    """SVG/HTML must never be inline-previewable (script vectors) even if
    they'd otherwise pass the plain-text check below."""
    head = sample[:256].lstrip().lower()
    return head.startswith(_MARKUP_PREFIXES) or b"<svg" in head


def _looks_like_text(sample: bytes) -> bool:
    if b"\x00" in sample:
        return False
    try:
        sample.decode("utf-8")
    except UnicodeDecodeError:
        return False
    return not _is_markup(sample)


def sniff_preview_mime(path: Path) -> str | None:
    """Return an allowlisted MIME type for `path`'s real content, or None
    if it must not be served inline."""
    try:
        with open(path, "rb") as fh:
            head = fh.read(64)
            sample = head + fh.read(8192 - len(head))
    except OSError:
        return None

    for sig, mime in _IMAGE_SIGNATURES:
        if head.startswith(sig):
            return mime
    if _is_webp(head):
        return "image/webp"
    if head.startswith(b"%PDF-"):
        return "application/pdf"
    if _is_mp4(head):
        return "video/mp4"
    if head.startswith(b"\x1a\x45\xdf\xa3"):
        return "video/webm"
    if head.startswith(b"OggS"):
        return "video/ogg"
    if _looks_like_text(sample):
        try:
            if path.stat().st_size > MAX_PREVIEW_TEXT_BYTES:
                return None
        except OSError:
            return None
        return "text/plain"
    return None


def preview_response_headers() -> dict[str, str]:
    """Hardening headers for an inline-preview response.

    - nosniff: browser must trust the Content-Type we computed, not guess
      its own (defeats content-confusion if our sniff is ever wrong).
    - X-Frame-Options/frame-ancestors SAMEORIGIN/'self': only our own app
      may embed this (e.g. the PDF viewer <iframe>) — the app-wide default
      set in app/main.py is DENY; this response opts back in, narrowly.
    - CSP sandbox + default-src 'none': if rendered as a document (PDF,
      text), no scripts/forms/popups/subresources execute.
    - Cache-Control: private file bytes never land in a shared/disk cache.
    """
    return {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "Content-Security-Policy": "sandbox; default-src 'none'; frame-ancestors 'self'",
        "Cache-Control": "private, no-store",
    }
