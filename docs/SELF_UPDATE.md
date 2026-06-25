# In-app self-update

StorageHub can check GitHub for a newer release and apply it
(pull → rebuild → restart) **from the app** — Settings → *Software update*.

## How it works

| Layer | Where | What it does |
|-------|-------|--------------|
| Check | `GET /api/v1/update/check` | Compares `APP_VERSION` with the latest GitHub release of `UPDATE_GITHUB_REPO`. Any signed-in user. |
| Apply | `POST /api/v1/update/apply` | **Admin only.** Writes a trigger file; the host updater performs the upgrade. |
| Status | `GET /api/v1/update/status` | Progress written by `scripts/self-update.sh`, so the UI survives the restart. |
| Updater | `scripts/self-update.sh` | The **only** thing the backend runs: `git` checkout of the latest tag + `docker compose up -d --build`. |

The mutating endpoint is gated by the existing `get_admin_user` dependency, and
the backend only ever runs the committed `self-update.sh` — never arbitrary code.

> `UPDATE_GITHUB_REPO` is the **release source** repo — distinct from the
> `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` used for OAuth login.

## Enabling "Update & restart"

Let a host process perform the upgrade. Pick one:

- **Host watcher (recommended):**
  ```bash
  ./scripts/self-update.sh --watch     # or a systemd unit / cron @reboot
  ```
- **In-process:** set `UPDATE_INPROC=1` and mount the repo + the Docker socket
  into the backend container.

Trigger/status files live under `/var/lib/storagehub/`
(`UPDATE_TRIGGER_FILE`, `UPDATE_STATUS_FILE`) — mount that path so the backend
and the host updater share it.

## Config (environment)

| Var | Default |
|-----|---------|
| `UPDATE_GITHUB_REPO` | `suryaex/storagehub` |
| `UPDATE_BRANCH` | `main` |
| `UPDATE_TRIGGER_FILE` | `/var/lib/storagehub/update.request` |
| `UPDATE_STATUS_FILE` | `/var/lib/storagehub/update.status` |
| `UPDATE_INPROC` | `false` |

## Manual use

```bash
./scripts/self-update.sh --check     # print current vs latest
./scripts/self-update.sh --apply     # upgrade now
```
