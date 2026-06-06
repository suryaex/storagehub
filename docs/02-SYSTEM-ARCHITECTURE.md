# 02-SYSTEM-ARCHITECTURE.md
# StorageHub System Architecture

Version: 1.0
Status: Draft Enterprise

---

# 1. Architecture Overview

StorageHub dibangun sebagai **modular monolith** untuk menjaga kesederhanaan, performa, dan kemudahan deployment di homelab.

## Core Stack
- Backend: Python FastAPI
- Database: MySQL 8
- Frontend: React.js + Vite + TailwindCSS
- Auth: OAuth2 / OpenID Connect
- Storage: Local filesystem
- Deployment: Docker Compose

## Design Principles
1. Lightweight
2. Mobile-first
3. Secure by default
4. File-centric UX
5. Minimal dependencies
6. Easy to self-host
7. Scalable without premature microservices

---

# 2. High-Level Architecture

```text
[Mobile / Tablet / Desktop Browser]
                |
                v
        [React Frontend SPA]
                |
                v
         [FastAPI Backend]
     /        |        |       \
    v         v        v        v
[Auth]    [Files]   [Search] [Admin]
    \         |        |       /
     \        v        v      /
      ---> [MySQL Database] <---
                 |
                 v
          [Storage Directory]
        /storage/users
        /storage/shared
        /storage/trash
        /storage/temp
```

---

# 3. Architecture Goals

## Functional Goals
- User login via OAuth
- Auto-provision user on first login
- Upload and download files
- Manage folders
- Share files
- Search files fast
- Admin can manage users and quota

## Technical Goals
- API response cepat
- Upload stabil untuk file besar
- Storage path sederhana
- Database normalized
- Frontend ringan dan responsive
- Mudah dijalankan di satu server

---

# 4. Backend Architecture

## 4.1 Framework
Backend menggunakan **FastAPI** karena:
- Async support
- OpenAPI docs otomatis
- Cepat
- Cocok untuk API-first development
- Mudah dipakai bersama SQLAlchemy / SQLModel

## 4.2 Backend Layers

### API Layer
- Menangani request dan response
- Validasi input
- Auth guard
- Pagination
- Error mapping

### Service Layer
- Business logic
- Permission checking
- File orchestration
- Sharing orchestration
- Upload session handling

### Repository Layer
- Query ke MySQL
- Transaction handling
- Entity persistence

### Storage Layer
- Menulis file ke disk
- Rename / move / delete file
- Chunk assembly
- Trash handling

---

# 5. Backend Module Breakdown

## 5.1 Auth Module
Tugas:
- OAuth login
- Callback handling
- Token issuance
- Session creation
- Auto user provisioning

Responsibilities:
- Validate OAuth provider response
- Match email/provider_id
- Create user if not exists
- Create root folder
- Create default quota

## 5.2 User Module
Tugas:
- User profile
- Role
- Quota
- Status
- Admin user actions

## 5.3 File Module
Tugas:
- Upload
- Download
- Rename
- Move
- Copy
- Delete
- Metadata handling
- Checksum verification

## 5.4 Folder Module
Tugas:
- Create folder
- Delete folder
- Rename folder
- Move folder
- Nested hierarchy

## 5.5 Sharing Module
Tugas:
- Create share link
- Revoke share
- Password protection
- Expired share
- Public/private access

## 5.6 Search Module
Tugas:
- Search by filename
- Search by folder
- Search by extension
- Search by size/date
- Search suggestions

## 5.7 Upload Module
Tugas:
- Chunk upload
- Resume upload
- Upload session tracking
- Merge chunks
- Validate checksum

## 5.8 Admin Module
Tugas:
- User list
- Quota control
- Disable user
- Audit logs
- System overview

---

# 6. Frontend Architecture

## 6.1 Frontend Stack
- React.js
- Vite
- TailwindCSS
- Zustand for local state
- TanStack Query for server state
- React Router for navigation

## 6.2 Frontend Design Goals
- macOS Tahoe inspired
- Finder-like explorer
- Liquid glass aesthetic
- Minimal but functional
- Responsive layouts
- Fast initial load
- Works well on phone, tablet, desktop

## 6.3 Frontend Layers

### Presentation Layer
- Pages
- Layouts
- Components

### State Layer
- Auth state
- UI state
- File selection state
- Upload queue state

### Data Layer
- API client
- Query hooks
- Mutation hooks

---

# 7. Frontend Page Architecture

## Public Pages
- Login
- OAuth redirect
- Error pages

## Private Pages
- Dashboard
- Files
- Shared
- Search
- Profile
- Settings
- Admin

## Supporting Views
- Upload modal
- Share modal
- Preview modal
- Confirm delete modal
- Rename modal
- Move modal

---

# 8. Storage Architecture

## 8.1 Storage Philosophy
File disimpan langsung pada filesystem lokal agar:
- sederhana
- cepat
- mudah di-backup
- mudah di-debug
- cocok untuk homelab

## 8.2 Storage Root
```text
/storage
/storage/users
/storage/shared
/storage/trash
/storage/temp
```

## 8.3 Path Strategy
Contoh:
```text
/storage/users/{user_id}/{folder_path}/{filename}
```

## 8.4 File Identity
File harus memiliki:
- file_id
- checksum_sha256
- storage_path
- owner_id
- folder_id
- version

## 8.5 Trash Strategy
Delete file awalnya menjadi soft delete:
- file dipindahkan ke `/storage/trash`
- metadata di DB ditandai deleted
- cleanup job menghapus permanen setelah masa retensi

---

# 9. File Upload Architecture

## 9.1 Upload Model
StorageHub menggunakan:
- multipart upload
- chunk upload
- resume upload
- progress tracking

## 9.2 Upload Flow
1. User memilih file
2. Frontend membagi file menjadi chunk
3. Frontend minta upload session
4. Backend membuat record upload session
5. Chunk dikirim satu per satu
6. Backend menyimpan chunk sementara
7. Setelah semua chunk selesai, backend merge chunks
8. Backend hitung checksum
9. Backend simpan metadata file
10. File muncul di explorer

## 9.3 Chunk Strategy
Recommended chunk size:
- 8 MB to 16 MB default
- dapat diubah berdasarkan bandwidth

## 9.4 Resume Strategy
Jika koneksi terputus:
- frontend meminta status session
- backend mengembalikan chunk yang sudah masuk
- upload dilanjutkan dari chunk terakhir

## 9.5 Integrity Strategy
Setelah merge:
- hitung SHA-256
- bandingkan checksum dari frontend bila ada
- jika mismatch, file ditandai invalid dan upload dianggap gagal

---

# 10. File Download Architecture

## 10.1 Download Modes
- Direct download
- Range download
- Resume download

## 10.2 Download Flow
1. User klik download
2. Backend cek permission
3. Backend stream file
4. Browser menerima file secara bertahap
5. Jika terputus, range request dipakai untuk lanjut

## 10.3 Download Safety
- Access control
- Optional signed link
- Expired share check
- Deleted file rejection

---

# 11. Sharing Architecture

## Share Types
- Private share
- Public share
- Password protected share
- Expiring share

## Share Flow
1. User pilih file
2. User klik share
3. Backend generate token
4. Backend simpan share record
5. Link dibagikan
6. Recipient membuka link
7. Backend validasi token
8. Backend stream file atau tampilkan preview

## Share Controls
- Revoke link
- Change password
- Change expiry
- Disable sharing

---

# 12. Search Architecture

## Search Scope
- File name
- Folder name
- Extension
- Date
- Size
- Owner

## Search Strategy
Untuk V1:
- MySQL indexed search
- query filtering
- pagination

Untuk V2:
- full-text index
- query suggestions
- recent searches

## Search UX
- Spotlight-style overlay
- keyboard shortcut `Ctrl + K`
- instant result preview

---

# 13. Authentication Architecture

## Supported Providers
- Google
- GitHub
- Microsoft
- Generic OIDC

## Authentication Strategy
- OAuth2 Authorization Code Flow
- PKCE where supported
- JWT access token
- Refresh token rotation

## Auto Provisioning Flow
1. User login dengan provider
2. Backend membaca email dan provider_id
3. Jika user belum ada, user dibuat otomatis
4. Root folder dibuat otomatis
5. Default quota diberikan
6. User diarahkan ke dashboard

## Session Strategy
- access token pendek
- refresh token lebih panjang
- logout menghapus token aktif

---

# 14. Permission Model

## Roles
- Admin
- User

## Access Rules
### Admin
- full access
- manage all users
- change quota
- view logs

### User
- akses file sendiri
- akses file shared sesuai izin
- tidak bisa melihat data user lain

---

# 15. Error Handling Architecture

## API Error Format
```json
{
  "success": false,
  "error": {
    "code": "FILE_NOT_FOUND",
    "message": "File tidak ditemukan"
  }
}
```

## Common Errors
- 400 invalid request
- 401 unauthorized
- 403 forbidden
- 404 not found
- 409 conflict
- 413 payload too large
- 429 too many requests
- 500 internal error
- 507 insufficient storage

---

# 16. Performance Architecture

## Target
- RAM idle < 300MB
- Upload file > 50GB
- Concurrent users > 100
- Fast API response < 200ms untuk operasi metadata

## Optimization Techniques
- lazy loading
- pagination
- async IO
- streaming download
- database indexing
- minimal frontend bundle
- server-side validation ringan

---

# 17. Security Architecture

## Security Controls
- HTTPS only
- secure cookies or bearer tokens
- CSRF protection for browser sessions
- rate limiting
- audit logs
- access checks per file/folder
- checksum validation
- file path sanitization

## Threats Addressed
- unauthorized access
- token leakage
- path traversal
- oversized upload abuse
- share token brute force
- disk exhaustion

---

# 18. Deployment Architecture

## Single Node Deployment
Ideal untuk homelab:
- frontend
- backend
- mysql
- storage directory

## Container Strategy
Docker Compose:
- app frontend
- app backend
- mysql
- reverse proxy

## Reverse Proxy
- Nginx
- Caddy
- Nginx Proxy Manager

## Optional External Access
- Cloudflare Tunnel
- VPN
- Port forwarding with SSL

---

# 19. Internal Communication Flow

## Example: Upload File
Frontend -> API -> Upload Session -> Storage -> DB -> Response

## Example: Share File
Frontend -> API -> Share Service -> DB -> Return token

## Example: Search
Frontend -> API -> Search Service -> MySQL -> Results

---

# 20. Roadmap Alignment

## V1
- OAuth login
- storage core
- file explorer
- upload/download
- sharing
- search
- admin

## V2
- preview
- trash
- activity logs
- improved upload resume

## V3
- WebDAV
- desktop sync
- S3 API

## V4
- multi node
- replication
- cluster mode

---

# 21. Design Decision Summary

StorageHub intentionally avoids excessive complexity in V1. The system remains a modular monolith with a simple filesystem-based storage layer, MySQL metadata, and React-based responsive UI. This keeps the application lightweight while preserving a clear path toward advanced features in later versions.
