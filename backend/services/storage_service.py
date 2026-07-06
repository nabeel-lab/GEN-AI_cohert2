"""
Google Cloud Storage integration for LaunchWise AI.

Uploads generated PDF/JSON reports to the configured bucket under
reports/{session_id}.(pdf|json) and returns a public/signed URL. Falls back
to serving files from the local `backend/sessions/` folder (same directory
already used for the JSON session fallback) when GCS credentials or the
bucket are unavailable — the frontend always gets a usable URL either way.
"""

import os
import logging
from typing import Optional

logger = logging.getLogger("launchwise.storage")

STORAGE_BUCKET = os.getenv("STORAGE_BUCKET", "")
LOCAL_FALLBACK_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sessions")
os.makedirs(LOCAL_FALLBACK_DIR, exist_ok=True)

_client = None
_bucket = None


def _init_client():
    global _client, _bucket
    if _client is not None:
        return _client

    if not STORAGE_BUCKET:
        logger.warning("STORAGE_BUCKET not configured — Cloud Storage disabled, using local fallback.")
        _client = False
        return None

    try:
        from google.cloud import storage

        client = storage.Client()
        bucket = client.bucket(STORAGE_BUCKET)
        # Cheap existence check — raises if the bucket is missing or unreachable.
        bucket.reload()
        _client = client
        _bucket = bucket
        logger.info(f"Cloud Storage connected: bucket={STORAGE_BUCKET}")
        return _client
    except Exception as e:
        logger.warning(f"Cloud Storage unavailable — using local fallback. Reason: {e}")
        _client = False
        return None


def is_available() -> bool:
    if _client is None:
        _init_client()
    return bool(_client)


def _local_fallback_write(session_id: str, extension: str, data: bytes) -> str:
    """Writes the file to backend/sessions/ and returns a path the frontend
    can request via GET /report-file/{session_id}.{extension}."""
    path = os.path.join(LOCAL_FALLBACK_DIR, f"{session_id}.{extension}")
    with open(path, "wb") as f:
        f.write(data)
    logger.info(f"[Storage fallback] Wrote {path}")
    return f"/api/report-file/{session_id}.{extension}"


def upload_pdf(session_id: str, pdf_bytes: bytes) -> str:
    """Uploads the PDF to reports/{session_id}.pdf. Returns a public URL,
    or a local-fallback relative URL if GCS is unavailable."""
    client = _init_client()
    if not client:
        return _local_fallback_write(session_id, "pdf", pdf_bytes)

    try:
        blob = _bucket.blob(f"reports/{session_id}.pdf")
        blob.upload_from_string(pdf_bytes, content_type="application/pdf")
        blob.make_public()
        logger.info(f"[Storage] Uploaded PDF for session {session_id}")
        return blob.public_url
    except Exception as e:
        logger.error(f"Cloud Storage PDF upload failed for {session_id}: {e} — using local fallback.")
        return _local_fallback_write(session_id, "pdf", pdf_bytes)


def upload_json(session_id: str, json_bytes: bytes) -> str:
    """Uploads the raw report JSON to reports/{session_id}.json."""
    client = _init_client()
    if not client:
        return _local_fallback_write(session_id, "json", json_bytes)

    try:
        blob = _bucket.blob(f"reports/{session_id}.json")
        blob.upload_from_string(json_bytes, content_type="application/json")
        blob.make_public()
        logger.info(f"[Storage] Uploaded JSON for session {session_id}")
        return blob.public_url
    except Exception as e:
        logger.error(f"Cloud Storage JSON upload failed for {session_id}: {e} — using local fallback.")
        return _local_fallback_write(session_id, "json", json_bytes)


def generate_signed_url(session_id: str, extension: str = "pdf", expiration_minutes: int = 60) -> Optional[str]:
    """Generates a time-limited signed URL for private-bucket access.
    Returns None if Cloud Storage is unavailable (callers should fall back
    to the public URL returned by upload_pdf/upload_json instead)."""
    client = _init_client()
    if not client:
        return None

    try:
        from datetime import timedelta

        blob = _bucket.blob(f"reports/{session_id}.{extension}")
        url = blob.generate_signed_url(expiration=timedelta(minutes=expiration_minutes), method="GET")
        return url
    except Exception as e:
        logger.error(f"Signed URL generation failed for {session_id}: {e}")
        return None
