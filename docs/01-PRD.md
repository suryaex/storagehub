
# 01-PRD.md
# StorageHub Product Requirements Document (PRD)

Version: 1.0
Status: Draft Enterprise
Product: StorageHub

---

# 1. Executive Summary

StorageHub adalah platform penyimpanan file self-hosted yang ringan, modern, dan responsif dengan pengalaman pengguna yang terinspirasi macOS Tahoe dan Finder.

Tujuan utama:
- Penyimpanan file terpusat
- Upload/download file besar
- File sharing
- OAuth login
- Mobile, tablet, desktop responsive
- Self-hosted untuk homelab dan small team

---

# 2. Vision

Menjadi alternatif ringan terhadap Google Drive, Dropbox, dan Nextcloud untuk pengguna homelab, network engineer, dan tim kecil.

---

# 3. Product Goals

## Primary Goals

- Mudah digunakan
- Performa tinggi
- Resource rendah
- Mendukung file >50GB
- OAuth only authentication

## Secondary Goals

- Finder-like experience
- Spotlight search
- Share link management
- Future WebDAV & S3 compatibility

---

# 4. Target Users

## Network Engineer

Kebutuhan:
- Firmware
- Backup router
- Backup switch
- ISO image
- Config archive

## SysAdmin

Kebutuhan:
- VM image
- Log archive
- Server backup

## Homelab Owner

Kebutuhan:
- Personal cloud
- Media storage
- Document management

## Small Team

Kebutuhan:
- Shared workspace
- File collaboration

---

# 5. User Personas

## Persona A

Nama: Surya
Role: Network Engineer

Goals:
- Menyimpan firmware
- Menyimpan backup konfigurasi
- Berbagi file ke tim

Pain Points:
- Sulit mencari file lama
- Transfer file besar lambat

---

# 6. Scope

## In Scope V1

- OAuth Login
- Dashboard
- File Explorer
- Folder Management
- Upload
- Download
- Sharing
- Search
- Admin Panel

## Out Of Scope V1

- WebDAV
- Desktop Sync
- S3 API
- Multi Node

---

# 7. Functional Requirements

## Authentication

FR-AUTH-001
User harus dapat login menggunakan Google.

FR-AUTH-002
User harus dapat login menggunakan GitHub.

FR-AUTH-003
User harus dapat login menggunakan Microsoft.

FR-AUTH-004
Jika user belum ada maka sistem membuat akun otomatis.

FR-AUTH-005
Sistem membuat root folder otomatis.

---

## User Management

FR-USER-001
Admin dapat melihat daftar user.

FR-USER-002
Admin dapat mengubah quota.

FR-USER-003
Admin dapat menonaktifkan akun.

---

## Dashboard

FR-DASH-001
Menampilkan storage usage.

FR-DASH-002
Menampilkan recent files.

FR-DASH-003
Menampilkan recent uploads.

FR-DASH-004
Menampilkan shared files.

---

## File Explorer

FR-FILE-001
Grid View

FR-FILE-002
List View

FR-FILE-003
Column View

FR-FILE-004
Rename File

FR-FILE-005
Move File

FR-FILE-006
Copy File

FR-FILE-007
Delete File

FR-FILE-008
Download File

---

## Folder Management

FR-FOLDER-001
Create Folder

FR-FOLDER-002
Rename Folder

FR-FOLDER-003
Delete Folder

FR-FOLDER-004
Nested Folder

---

## Upload Engine

FR-UPLOAD-001
Chunk Upload

FR-UPLOAD-002
Resume Upload

FR-UPLOAD-003
Parallel Upload

FR-UPLOAD-004
Upload Progress

FR-UPLOAD-005
Pause Upload

FR-UPLOAD-006
Cancel Upload

---

## Download Engine

FR-DOWNLOAD-001
Resume Download

FR-DOWNLOAD-002
Range Request

FR-DOWNLOAD-003
Download Queue

---

## Sharing

FR-SHARE-001
Public Link

FR-SHARE-002
Password Protected Link

FR-SHARE-003
Expiration Date

FR-SHARE-004
Disable Link

---

## Search

FR-SEARCH-001
Search Filename

FR-SEARCH-002
Search Folder

FR-SEARCH-003
Search Extension

FR-SEARCH-004
Search Size

FR-SEARCH-005
Search Date

---

# 8. Non Functional Requirements

## Performance

NFR-001
API Response < 200ms

NFR-002
RAM Usage < 300MB idle

NFR-003
Support upload > 50GB

NFR-004
100 concurrent users

---

## Security

NFR-SEC-001
HTTPS Only

NFR-SEC-002
JWT Session

NFR-SEC-003
OAuth Authentication

NFR-SEC-004
Rate Limiting

NFR-SEC-005
CSRF Protection

---

# 9. Success Metrics

- Upload Success Rate > 99%
- Login Success Rate > 99%
- API Availability > 99.9%
- User Satisfaction > 90%

---

# 10. MVP Definition

V1 Release:
- Login
- Dashboard
- File Explorer
- Upload
- Download
- Sharing
- Search
- Admin

---

# 11. Risks

- Large file upload failures
- OAuth provider outage
- Storage corruption
- Disk full

Mitigation:
- Chunk upload
- Retry logic
- Checksums
- Quota management

---

# 12. Roadmap Summary

V1
Core Storage Platform

V2
Preview + Trash + Activity Logs

V3
Desktop Sync + WebDAV

V4
S3 API + Cluster Mode
