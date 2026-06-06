# 10-PROJECT-STRUCTURE.md
# StorageHub Project Structure

Version: 1.0
Status: Enterprise Blueprint

---

# 1. Purpose

Dokumen ini menjelaskan struktur repository dan arsitektur folder project StorageHub agar proses development, code generation, dan deployment menjadi konsisten.

Struktur ini dibuat untuk mendukung stack utama StorageHub:
- Backend: Python FastAPI
- Database: MySQL 8
- Frontend: React.js + Vite + TailwindCSS
- Auth: OAuth2 / OIDC
- UI: macOS Tahoe inspired
- Explorer: Finder-like
- Responsive: mobile, tablet, desktop

Referensi utama tetap mengikuti visi lightweight file storage platform dan fitur inti seperti OAuth login, file & folder management, chunk upload, resume upload, sharing, search, dashboard, serta admin panel. fileciteturn0file0L5-L12 fileciteturn0file0L14-L30

---

# 2. Repository Philosophy

## Goals
- mudah dipahami
- mudah di-maintain
- mudah di-scale
- mudah di-generate code by AI
- modular tetapi tidak berlebihan
- cocok untuk single-server deployment

## Design Choice
StorageHub menggunakan pendekatan **modular monolith**.

Alasan:
- lebih ringan daripada microservices
- lebih cepat untuk homelab
- lebih sederhana untuk deploy
- lebih mudah untuk AI code generation
- cukup fleksibel untuk future scale-out

---

# 3. Root Repository Structure

```text
storagehub/
├── backend/
├── frontend/
├── database/
├── deployment/
├── docs/
├── scripts/
├── tests/
├── storage/
├── .env.example
├── docker-compose.yml
├── README.md
└── Makefile
```

## Root Folder Meaning
- `backend/` → FastAPI application
- `frontend/` → React application
- `database/` → schema, migrations, seeds
- `deployment/` → Docker, nginx, reverse proxy, SSL
- `docs/` → PRD, architecture, ERD, API spec, UI spec
- `scripts/` → utility scripts
- `tests/` → integration and unit tests
- `storage/` → local file storage root for runtime
- `.env.example` → environment template
- `docker-compose.yml` → local and homelab deployment
- `README.md` → project overview
- `Makefile` → common developer commands

---

# 4. Backend Structure

## 4.1 Backend Root

```text
backend/
├── app/
├── alembic/
├── tests/
├── pyproject.toml
├── requirements.txt
├── Dockerfile
└── main.py
```

## 4.2 Application Package

```text
backend/app/
├── api/
├── core/
├── db/
├── models/
├── schemas/
├── services/
├── repositories/
├── security/
├── modules/
├── utils/
├── exceptions/
└── __init__.py
```

---

# 5. Backend Folder Details

## 5.1 app/api
Tugas:
- router per module
- endpoint definitions
- versioning API

Contoh:
```text
backend/app/api/
├── v1/
│   ├── auth.py
│   ├── users.py
│   ├── folders.py
│   ├── files.py
│   ├── uploads.py
│   ├── shares.py
│   ├── search.py
│   ├── trash.py
│   ├── dashboard.py
│   └── admin.py
└── deps.py
```

---

## 5.2 app/core
Tugas:
- configuration
- constants
- logging
- app startup
- environment loading

Contoh:
```text
backend/app/core/
├── config.py
├── constants.py
├── logging.py
├── startup.py
├── security.py
└── settings.py
```

---

## 5.3 app/db
Tugas:
- database session
- engine
- base model
- transactional helpers

Contoh:
```text
backend/app/db/
├── session.py
├── base.py
├── init_db.py
└── migrations_helper.py
```

---

## 5.4 app/models
Tugas:
- SQLAlchemy models
- MySQL entity mapping

Contoh:
```text
backend/app/models/
├── user.py
├── oauth_account.py
├── folder.py
├── file.py
├── share.py
├── upload_session.py
├── upload_chunk.py
├── activity_log.py
├── refresh_token.py
├── quota_policy.py
├── system_setting.py
└── trash_item.py
```

---

## 5.5 app/schemas
Tugas:
- Pydantic request/response schema
- validation model

Contoh:
```text
backend/app/schemas/
├── auth.py
├── user.py
├── folder.py
├── file.py
├── share.py
├── upload.py
├── search.py
├── dashboard.py
├── admin.py
├── trash.py
└── common.py
```

---

## 5.6 app/services
Tugas:
- business logic
- orchestrating repositories
- permission checks
- file operations
- sharing operations
- upload orchestration

Contoh:
```text
backend/app/services/
├── auth_service.py
├── user_service.py
├── folder_service.py
├── file_service.py
├── share_service.py
├── upload_service.py
├── search_service.py
├── dashboard_service.py
├── admin_service.py
├── trash_service.py
└── storage_service.py
```

---

## 5.7 app/repositories
Tugas:
- DB queries
- CRUD
- filtering
- pagination
- joins

Contoh:
```text
backend/app/repositories/
├── user_repository.py
├── oauth_repository.py
├── folder_repository.py
├── file_repository.py
├── share_repository.py
├── upload_repository.py
├── upload_chunk_repository.py
├── activity_log_repository.py
├── quota_repository.py
├── refresh_token_repository.py
├── settings_repository.py
└── trash_repository.py
```

---

## 5.8 app/security
Tugas:
- OAuth handlers
- JWT creation
- token rotation
- password hashing if ever needed
- permission utilities

Contoh:
```text
backend/app/security/
├── oauth.py
├── jwt.py
├── permissions.py
├── tokens.py
├── hashes.py
└── guards.py
```

---

## 5.9 app/modules
Tugas:
- modular feature grouping for large codebases

Contoh:
```text
backend/app/modules/
├── auth/
├── users/
├── folders/
├── files/
├── uploads/
├── shares/
├── search/
├── dashboard/
├── admin/
└── trash/
```

---

## 5.10 app/utils
Tugas:
- helper functions
- path utils
- filename sanitize
- checksum helpers
- pagination utils

Contoh:
```text
backend/app/utils/
├── checksum.py
├── files.py
├── paths.py
├── pagination.py
├── response.py
└── validators.py
```

---

## 5.11 app/exceptions
Tugas:
- custom exceptions
- error mapping

Contoh:
```text
backend/app/exceptions/
├── base.py
├── auth.py
├── files.py
├── folders.py
├── shares.py
├── uploads.py
├── quota.py
└── storage.py
```

---

# 6. Frontend Structure

## 6.1 Frontend Root

```text
frontend/
├── src/
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── Dockerfile
```

## 6.2 Frontend Source Tree

```text
frontend/src/
├── app/
├── components/
├── layouts/
├── pages/
├── routes/
├── hooks/
├── services/
├── store/
├── styles/
├── utils/
├── assets/
└── types/
```

---

# 7. Frontend Folder Details

## 7.1 src/app
Tugas:
- app bootstrap
- providers
- query client
- router setup
- auth guard

Contoh:
```text
frontend/src/app/
├── App.tsx
├── main.tsx
├── providers.tsx
└── router.tsx
```

---

## 7.2 src/components
Tugas:
- reusable UI components

Contoh:
```text
frontend/src/components/
├── ui/
├── layout/
├── file/
├── folder/
├── upload/
├── share/
├── search/
├── admin/
├── feedback/
└── common/
```

---

## 7.3 src/layouts
Tugas:
- app shell
- page layout
- responsive structure

Contoh:
```text
frontend/src/layouts/
├── AppShell.tsx
├── AuthLayout.tsx
├── DashboardLayout.tsx
├── ExplorerLayout.tsx
└── AdminLayout.tsx
```

---

## 7.4 src/pages
Tugas:
- route level screens

Contoh:
```text
frontend/src/pages/
├── LoginPage.tsx
├── DashboardPage.tsx
├── FilesPage.tsx
├── FolderPage.tsx
├── SharedPage.tsx
├── SearchPage.tsx
├── TrashPage.tsx
├── ProfilePage.tsx
├── SettingsPage.tsx
└── AdminPage.tsx
```

---

## 7.5 src/routes
Tugas:
- route definition
- protected routes
- public routes

Contoh:
```text
frontend/src/routes/
├── index.tsx
├── protected.tsx
└── public.tsx
```

---

## 7.6 src/hooks
Tugas:
- reusable hooks
- auth hooks
- responsive hooks
- keyboard shortcuts

Contoh:
```text
frontend/src/hooks/
├── useAuth.ts
├── useResponsive.ts
├── useKeyboardShortcuts.ts
├── useUploadQueue.ts
└── useFileActions.ts
```

---

## 7.7 src/services
Tugas:
- API client
- auth requests
- file requests
- upload requests

Contoh:
```text
frontend/src/services/
├── api.ts
├── authService.ts
├── userService.ts
├── fileService.ts
├── folderService.ts
├── shareService.ts
├── uploadService.ts
├── searchService.ts
├── adminService.ts
└── trashService.ts
```

---

## 7.8 src/store
Tugas:
- Zustand stores

Contoh:
```text
frontend/src/store/
├── authStore.ts
├── uiStore.ts
├── fileStore.ts
├── uploadStore.ts
├── searchStore.ts
└── shareStore.ts
```

---

## 7.9 src/styles
Tugas:
- theme
- tokens
- global styles
- glass effects

Contoh:
```text
frontend/src/styles/
├── globals.css
├── theme.css
├── tokens.css
└── glass.css
```

---

# 8. Database Structure

## 8.1 Database Folder

```text
database/
├── migrations/
├── seeds/
├── schema/
└── docs/
```

## 8.2 Contents
- migration files
- seed data
- schema exports
- ERD diagrams
- SQL utilities

---

# 9. Deployment Structure

```text
deployment/
├── docker/
├── nginx/
├── ssl/
├── compose/
├── scripts/
└── monitoring/
```

## 9.1 docker
- Dockerfiles
- build helpers

## 9.2 nginx
- reverse proxy config
- TLS termination
- compression
- caching

## 9.3 ssl
- certificate files or notes
- renewal scripts

## 9.4 compose
- docker-compose fragments
- environment-specific compose

---

# 10. Docs Structure

```text
docs/
├── 01-PRD.md
├── 02-SYSTEM-ARCHITECTURE.md
├── 03-DATABASE-DESIGN.md
├── 04-ERD.md
├── 05-API-SPEC.md
├── 06-UI-UX-SPEC.md
├── 07-SITEMAP-USERFLOW.md
├── 08-WIREFRAMES.md
├── 09-AI-GENERATION-PROMPTS.md
├── 10-PROJECT-STRUCTURE.md
├── 11-DOCKER-DEPLOYMENT.md
└── 12-ROADMAP.md
```

---

# 11. Scripts Structure

```text
scripts/
├── backup.sh
├── restore.sh
├── migrate.sh
├── seed.sh
├── clean_temp.sh
└── health_check.sh
```

---

# 12. Tests Structure

```text
tests/
├── backend/
├── frontend/
├── integration/
├── e2e/
└── fixtures/
```

## Test Types
- unit tests
- integration tests
- API tests
- E2E tests

---

# 13. Storage Runtime Structure

```text
storage/
├── users/
├── shared/
├── trash/
└── temp/
```

## Notes
- folder ini untuk runtime file fisik
- jangan simpan source code di sini
- backup wajib rutin
- permission harus aman

---

# 14. Naming Convention

## Files
- snake_case untuk file Python
- PascalCase untuk React component
- kebab-case untuk dokumen markdown

## Database
- singular table names direkomendasikan untuk konsistensi internal
- namun boleh plural jika semua tabel mengikuti pola yang sama

## Routes
- gunakan versioning `/api/v1`
- endpoint resource-based dan konsisten

---

# 15. Code Organization Standards

## Backend Standards
- router hanya berisi endpoint
- service berisi business logic
- repository berisi query
- model hanya entity mapping
- schema untuk request/response
- utils untuk helper kecil

## Frontend Standards
- pages untuk route level
- components untuk reusable pieces
- layouts untuk app shell
- services untuk API
- store untuk state global
- hooks untuk logic reusable

---

# 16. Recommended Tech Layout

## Backend
- FastAPI
- Uvicorn
- SQLAlchemy 2.x
- Alembic
- Pydantic

## Frontend
- React
- Vite
- TailwindCSS
- Zustand
- TanStack Query
- React Router

## Database
- MySQL 8

## Deployment
- Docker Compose
- Nginx
- optional Cloudflare Tunnel

---

# 17. Minimal MVP Project Structure

Jika ingin versi awal yang ringan, cukup pakai:

```text
backend/
frontend/
database/
deployment/
docs/
storage/
```

Dan di dalam backend:
- auth
- users
- folders
- files
- uploads
- shares
- search
- admin
- trash

---

# 18. Future Scaling Structure

Jika nanti diperluas:
- dapat dipisah ke service terpisah
- dapat ditambah worker background
- dapat ditambah preview service
- dapat ditambah sync service
- dapat ditambah notification service

Namun untuk v1, modular monolith tetap pilihan terbaik.

---

# 19. Final Recommended Structure

Struktur final yang paling realistis untuk StorageHub:

```text
storagehub/
├── backend/
│   └── app/
├── frontend/
│   └── src/
├── database/
├── deployment/
├── docs/
├── scripts/
├── tests/
└── storage/
```

Ini menjaga repository tetap:
- rapi
- ringan
- mudah di-generate oleh AI
- mudah dipahami developer
- cocok untuk homelab
