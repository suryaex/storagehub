# 05-API-SPEC.md
# StorageHub API Specification

Version: 1.0
Status: Draft Enterprise
Base Path: /api/v1

---

# 1. API Design Principles

StorageHub API dirancang untuk:
- ringan
- konsisten
- mudah di-generate ke FastAPI
- kompatibel dengan frontend React
- mendukung upload besar dan resume
- aman untuk self-hosted deployment

## Standard Response Shape

### Success
```json
{
  "success": true,
  "data": {},
  "message": "OK"
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Pesan error yang mudah dibaca"
  }
}
```

---

# 2. Common Standards

## 2.1 Authentication
Sebagian besar endpoint private memakai:
- Bearer JWT Access Token

Header:
```http
Authorization: Bearer <access_token>
```

## 2.2 Content Types
- `application/json`
- `multipart/form-data`
- `application/octet-stream`
- `text/plain`

## 2.3 Pagination
Query:
- `page` default 1
- `limit` default 20
- `sort` optional
- `order` asc/desc

Response pagination:
```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 100,
  "total_pages": 5
}
```

## 2.4 Error Codes
- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `PAYLOAD_TOO_LARGE`
- `QUOTA_EXCEEDED`
- `UPLOAD_SESSION_INVALID`
- `FILE_NOT_FOUND`
- `FOLDER_NOT_FOUND`
- `SHARE_EXPIRED`
- `SHARE_DISABLED`
- `CHECKSUM_MISMATCH`
- `INSUFFICIENT_STORAGE`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

---

# 3. Authentication API

## 3.1 Start Google Login
### GET /auth/google

Redirect user ke Google OAuth flow.

### Response
HTTP 302 redirect to Google authorization URL.

---

## 3.2 Start GitHub Login
### GET /auth/github

Redirect user ke GitHub OAuth flow.

---

## 3.3 Start Microsoft Login
### GET /auth/microsoft

Redirect user ke Microsoft OAuth flow.

---

## 3.4 OAuth Callback
### GET /auth/callback/{provider}

Provider:
- google
- github
- microsoft
- oidc

### Query
- `code`
- `state`

### Flow
1. Validate provider
2. Exchange authorization code
3. Fetch user profile
4. Match by provider_subject or email
5. Create user if not exists
6. Create oauth account record
7. Issue access token
8. Issue refresh token
9. Redirect to frontend dashboard

### Success Response
Redirect to:
```text
/app
```

### Error Cases
- invalid state
- code exchange failed
- provider unavailable
- missing email
- profile fetch failed

---

## 3.5 Current User
### GET /auth/me

### Auth
Required

### Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "User Name",
    "avatar_url": "https://...",
    "role": "user",
    "status": "active",
    "quota_bytes": 10737418240,
    "used_bytes": 5242880
  },
  "message": "OK"
}
```

---

## 3.6 Refresh Token
### POST /auth/refresh

### Request
```json
{
  "refresh_token": "string"
}
```

### Response
```json
{
  "success": true,
  "data": {
    "access_token": "string",
    "refresh_token": "string",
    "expires_in": 900
  },
  "message": "Token refreshed"
}
```

### Error
- invalid refresh token
- revoked token
- expired token

---

## 3.7 Logout
### POST /auth/logout

### Auth
Required

### Request
```json
{
  "refresh_token": "string"
}
```

### Action
- revoke refresh token
- clear session
- log activity

---

# 4. User API

## 4.1 List Users
### GET /users

### Auth
Admin only

### Query
- page
- limit
- search
- role
- status

### Response
```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 1,
    "limit": 20,
    "total": 0
  },
  "message": "OK"
}
```

---

## 4.2 Get User Detail
### GET /users/{id}

### Auth
Admin only

---

## 4.3 Update User
### PATCH /users/{id}

### Auth
Admin only

### Request
```json
{
  "full_name": "New Name",
  "role": "admin",
  "status": "active",
  "quota_bytes": 21474836480
}
```

### Validation
- quota_bytes must be positive
- role must be admin/user
- status must be active/disabled/pending

---

## 4.4 Disable User
### POST /users/{id}/disable

### Auth
Admin only

---

## 4.5 Enable User
### POST /users/{id}/enable

### Auth
Admin only

---

## 4.6 Delete User
### DELETE /users/{id}

### Auth
Admin only

### Notes
- soft delete preferred
- if user deleted, related files/folders follow cleanup policy

---

## 4.7 My Profile
### GET /users/me

### Auth
Required

---

## 4.8 Update My Profile
### PATCH /users/me

### Auth
Required

### Request
```json
{
  "full_name": "Updated Name"
}
```

---

# 5. Folder API

## 5.1 List Folder Contents
### GET /folders/{folder_id}/contents

### Auth
Required

### Query
- page
- limit
- sort
- order

### Response
```json
{
  "success": true,
  "data": {
    "folder": {},
    "subfolders": [],
    "files": []
  },
  "message": "OK"
}
```

---

## 5.2 Create Folder
### POST /folders

### Auth
Required

### Request
```json
{
  "parent_id": 10,
  "name": "Firmware"
}
```

### Validation
- name required
- no duplicate folder name under same parent for same owner

### Response
```json
{
  "success": true,
  "data": {
    "id": 100,
    "name": "Firmware",
    "parent_id": 10
  },
  "message": "Folder created"
}
```

---

## 5.3 Get Folder Detail
### GET /folders/{id}

### Auth
Required

---

## 5.4 Rename Folder
### PUT /folders/{id}

### Auth
Required

### Request
```json
{
  "name": "New Folder Name"
}
```

---

## 5.5 Move Folder
### POST /folders/{id}/move

### Auth
Required

### Request
```json
{
  "parent_id": 20
}
```

---

## 5.6 Delete Folder
### DELETE /folders/{id}

### Auth
Required

### Notes
- soft delete
- move to trash
- children folder/file handling must be consistent

---

## 5.7 Restore Folder
### POST /folders/{id}/restore

### Auth
Required

### Action
- restore from trash
- validate parent path still exists

---

# 6. File API

## 6.1 List Files
### GET /files

### Auth
Required

### Query
- folder_id
- page
- limit
- search
- extension
- sort
- order

---

## 6.2 File Detail
### GET /files/{id}

### Auth
Required

### Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "folder_id": 10,
    "owner_id": 2,
    "filename": "backup.zip",
    "size_bytes": 123456789,
    "mime_type": "application/zip",
    "checksum_sha256": "..."
  },
  "message": "OK"
}
```

---

## 6.3 Upload File (Simple)
### POST /files/upload

### Auth
Required

### Content-Type
`multipart/form-data`

### Fields
- `file`
- `folder_id`

### Behavior
- valid for small and medium files
- optional fallback mode for non-chunk uploads

### Error
- `PAYLOAD_TOO_LARGE`
- `QUOTA_EXCEEDED`
- `INSUFFICIENT_STORAGE`

---

## 6.4 Download File
### GET /files/{id}/download

### Auth
Required

### Behavior
- stream file
- support range requests if possible

---

## 6.5 Rename File
### PUT /files/{id}

### Auth
Required

### Request
```json
{
  "filename": "new-name.zip"
}
```

---

## 6.6 Move File
### POST /files/{id}/move

### Auth
Required

### Request
```json
{
  "folder_id": 20
}
```

---

## 6.7 Copy File
### POST /files/{id}/copy

### Auth
Required

### Request
```json
{
  "folder_id": 20
}
```

---

## 6.8 Delete File
### DELETE /files/{id}

### Auth
Required

### Behavior
- soft delete
- move to trash

---

## 6.9 Restore File
### POST /files/{id}/restore

### Auth
Required

---

## 6.10 Permanent Delete File
### DELETE /files/{id}/permanent

### Auth
Required

### Notes
- admin or owner only
- removes file physically and from database

---

# 7. Upload Session API

## 7.1 Create Upload Session
### POST /uploads/sessions

### Auth
Required

### Request
```json
{
  "folder_id": 10,
  "file_name": "firmware.bin",
  "original_filename": "firmware.bin",
  "mime_type": "application/octet-stream",
  "size_bytes": 123456789,
  "chunk_size_bytes": 8388608
}
```

### Response
```json
{
  "success": true,
  "data": {
    "session_id": 1001,
    "total_chunks": 15,
    "uploaded_chunks": 0
  },
  "message": "Upload session created"
}
```

---

## 7.2 Upload Chunk
### POST /uploads/sessions/{session_id}/chunks/{chunk_index}

### Auth
Required

### Content-Type
`application/octet-stream`

### Headers
- `X-Chunk-Hash`
- `X-Chunk-Size`

### Behavior
- store chunk temp file
- update chunk status
- return progress

### Error
- invalid chunk index
- duplicate chunk
- checksum mismatch

---

## 7.3 Get Upload Session Status
### GET /uploads/sessions/{session_id}

### Auth
Required

### Response
```json
{
  "success": true,
  "data": {
    "session_id": 1001,
    "status": "uploading",
    "total_chunks": 15,
    "uploaded_chunks": 10
  },
  "message": "OK"
}
```

---

## 7.4 Resume Upload Session
### POST /uploads/sessions/{session_id}/resume

### Auth
Required

### Response
```json
{
  "success": true,
  "data": {
    "missing_chunks": [10,11,12,13,14]
  },
  "message": "Resume info generated"
}
```

---

## 7.5 Complete Upload Session
### POST /uploads/sessions/{session_id}/complete

### Auth
Required

### Behavior
- merge chunks
- calculate checksum
- create file metadata
- update user used_bytes
- cleanup chunks

---

## 7.6 Abort Upload Session
### POST /uploads/sessions/{session_id}/abort

### Auth
Required

### Behavior
- mark aborted
- delete temp chunks
- remove session data

---

# 8. Sharing API

## 8.1 Create Share
### POST /shares

### Auth
Required

### Request
```json
{
  "file_id": 1,
  "folder_id": null,
  "password": "optional",
  "expires_at": "2026-12-31T23:59:59Z",
  "max_downloads": 10
}
```

### Notes
- file_id or folder_id must be provided, not both
- password is optional
- expiration optional

### Response
```json
{
  "success": true,
  "data": {
    "token": "abc123xyz",
    "share_url": "https://domain/share/abc123xyz"
  },
  "message": "Share created"
}
```

---

## 8.2 List My Shares
### GET /shares

### Auth
Required

---

## 8.3 Get Share Detail
### GET /shares/{id}

### Auth
Required

---

## 8.4 Revoke Share
### DELETE /shares/{id}

### Auth
Required

### Behavior
- disable share link
- link no longer valid

---

## 8.5 Public Share Access
### GET /share/{token}

### Auth
Optional depending on share type

### Behavior
- validate token
- check expiry
- check password if present
- return file/folder metadata or stream download

---

## 8.6 Validate Share Password
### POST /share/{token}/password

### Request
```json
{
  "password": "secret"
}
```

---

# 9. Search API

## 9.1 Global Search
### GET /search

### Auth
Required

### Query
- `q`
- `type`
- `folder_id`
- `extension`
- `page`
- `limit`

### Example
```text
/api/v1/search?q=firmware
```

### Response
```json
{
  "success": true,
  "data": {
    "files": [],
    "folders": [],
    "shares": []
  },
  "message": "OK"
}
```

---

## 9.2 Recent Searches
### GET /search/recent

### Auth
Required

---

## 9.3 Search Suggestions
### GET /search/suggestions?q=abc

### Auth
Required

---

# 10. Dashboard API

## 10.1 Dashboard Summary
### GET /dashboard/summary

### Auth
Required

### Response
```json
{
  "success": true,
  "data": {
    "storage_usage": {
      "used_bytes": 123,
      "quota_bytes": 456
    },
    "recent_files": [],
    "recent_uploads": [],
    "shared_files": []
  },
  "message": "OK"
}
```

---

# 11. Admin API

## 11.1 System Overview
### GET /admin/overview

### Auth
Admin only

---

## 11.2 List Users
### GET /admin/users

### Auth
Admin only

---

## 11.3 Update User Quota
### PATCH /admin/users/{id}/quota

### Auth
Admin only

### Request
```json
{
  "quota_bytes": 21474836480
}
```

---

## 11.4 View Activity Logs
### GET /admin/activity-logs

### Auth
Admin only

### Query
- page
- limit
- action
- user_id
- date_from
- date_to

---

## 11.5 System Settings
### GET /admin/settings
### PATCH /admin/settings

### Auth
Admin only

### Example
```json
{
  "default_user_quota": 10737418240,
  "trash_retention_days": 30,
  "max_upload_size": 53687091200
}
```

---

# 12. Trash API

## 12.1 List Trash
### GET /trash

### Auth
Required

---

## 12.2 Restore Trash Item
### POST /trash/{id}/restore

### Auth
Required

---

## 12.3 Permanent Delete Trash Item
### DELETE /trash/{id}/permanent

### Auth
Required

---

# 13. Health API

## 13.1 Health Check
### GET /health

### Auth
None

### Response
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "StorageHub",
    "version": "1.0"
  },
  "message": "Healthy"
}
```

---

## 13.2 Readiness Check
### GET /ready

### Auth
None

### Purpose
- check database connection
- check storage availability

---

# 14. Validation Rules

## File Name
- required
- max length 255
- cannot contain invalid path characters

## Folder Name
- required
- max length 255
- unique within same parent for same owner

## Quota
- must not exceed user quota

## Share
- must target file or folder
- expiry must be future date if present

## Upload Session
- chunk size must be positive
- total size must be positive
- file name required

---

# 15. Rate Limiting Policy

Apply rate limit on:
- login callback
- search
- share validation
- upload session creation
- public share access

Suggested policy:
- 60 requests/minute per user for metadata API
- stricter for auth endpoints
- upload endpoints may use separate policy

---

# 16. Permission Matrix

| Endpoint Group | User | Admin |
|---|---:|---:|
| /auth | Yes | Yes |
| /users/me | Yes | Yes |
| /users/* | No | Yes |
| /folders | Yes | Yes |
| /files | Yes | Yes |
| /uploads | Yes | Yes |
| /shares | Yes | Yes |
| /search | Yes | Yes |
| /admin | No | Yes |
| /health | Public | Public |

---

# 17. OpenAPI Notes

## Tags
- auth
- users
- folders
- files
- uploads
- shares
- search
- dashboard
- admin
- trash
- health

## Schema Naming
- `UserResponse`
- `FolderResponse`
- `FileResponse`
- `ShareResponse`
- `UploadSessionResponse`
- `ErrorResponse`

---

# 18. Example Endpoint Grouping

## Auth
- GET /auth/google
- GET /auth/github
- GET /auth/microsoft
- GET /auth/callback/{provider}
- POST /auth/refresh
- POST /auth/logout
- GET /auth/me

## Files
- GET /files
- POST /files/upload
- GET /files/{id}
- GET /files/{id}/download
- PUT /files/{id}
- DELETE /files/{id}

## Uploads
- POST /uploads/sessions
- POST /uploads/sessions/{id}/chunks/{index}
- GET /uploads/sessions/{id}
- POST /uploads/sessions/{id}/resume
- POST /uploads/sessions/{id}/complete
- POST /uploads/sessions/{id}/abort

## Shares
- POST /shares
- GET /shares
- GET /shares/{id}
- DELETE /shares/{id}
- GET /share/{token}
- POST /share/{token}/password

---

# 19. Implementation Notes for FastAPI

- Use APIRouter per module
- Use Pydantic request/response models
- Use dependency injection for auth
- Use service layer for business logic
- Use repository layer for queries
- Use exception handlers for standard errors
- Generate OpenAPI docs automatically from schema

---

# 20. Summary

Dokumen API ini cukup detail untuk menjadi dasar implementasi FastAPI backend StorageHub, dengan fokus pada:
- OAuth login
- auto provisioning
- file/folder management
- chunk upload
- resume upload
- sharing
- search
- admin
- trash
- health check

Struktur endpoint dibuat agar frontend React dan backend FastAPI dapat dikembangkan secara paralel tanpa banyak perubahan desain.
