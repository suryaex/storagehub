# StorageHub — Security

## Hardening built in
- **Refuses to boot in production with a default `SECRET_KEY`.** Set a strong
  `SECRET_KEY` in `.env` when `ENVIRONMENT=production`.
- **Security headers** on every response: `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`. Enable HSTS
  with `ENABLE_HSTS=true` when served strictly over HTTPS.
- **Service ingest** (`/api/v1/ingest/*`, used by SecureOps backups) is
  authenticated with `SERVICE_API_KEYS` via the `X-API-Key` header
  (constant-time compare), size-capped (256 MiB), and **path-traversal-safe** —
  the source/filename are sanitized and the resolved path is verified to stay
  inside `STORAGE_ROOT`. Disabled until at least one key is configured.
- **Auth**: OAuth2/OIDC with short-lived access tokens + rotating refresh tokens
  (refresh tokens stored as SHA-256 digests, never plaintext).
- **Uploads**: per-user quota enforcement, chunked with SHA-256 verification.
- **SQLi**: SQLAlchemy ORM throughout (parameterized queries).

## Recommended production config
```bash
ENVIRONMENT=production
SECRET_KEY=$(openssl rand -base64 48)
ALLOW_LOCAL_LOGIN=false                 # require real OAuth in production
SERVICE_API_KEYS=$(openssl rand -hex 32)
ENABLE_HSTS=true
CORS_ORIGINS=https://storage.example.com
```
- Serve over HTTPS (`certbot --nginx`) and set OAuth callback URLs to the HTTPS host.
- Keep MariaDB/MySQL bound to localhost (or the Docker network) — never expose 3306.
- Back up `STORAGE_ROOT` and the database regularly.

## Coexistence
StorageHub defaults to web `:8080` / backend `:8010` so it runs alongside
SecureOps (`:80`/`:8000`) without conflict — see [`INTEROP.md`](INTEROP.md).

## Reporting a vulnerability
Email the maintainer (Muhammad Surya Ragasin, Politeknik Negeri Sriwijaya).
Please do not open public issues for security reports.
