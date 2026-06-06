# 03-DATABASE-DESIGN.md
# StorageHub Database Design

Version: 1.0
Status: Draft Enterprise
Database: MySQL 8

---

# 1. Database Design Principles

StorageHub memakai MySQL sebagai metadata database, sedangkan file fisik disimpan di filesystem lokal.

## Prinsip Desain
1. Normalisasi data untuk metadata penting
2. File fisik tidak disimpan di database
3. Setiap file harus punya checksum
4. Semua relasi utama harus konsisten dengan foreign key
5. Soft delete diprioritaskan untuk mencegah kehilangan data
6. Index harus dibuat pada kolom pencarian dan relasi
7. Skema harus tetap sederhana agar ringan di homelab

---

# 2. High-Level Data Model

Entity utama:
- users
- folders
- files
- shares
- upload_sessions
- upload_chunks
- activity_logs
- quota_policies
- oauth_accounts
- refresh_tokens
- system_settings
- trash_items

Relasi inti:
- 1 user memiliki banyak folder
- 1 user memiliki banyak file
- 1 folder memiliki banyak file
- 1 file dapat memiliki banyak share link
- 1 user memiliki banyak upload session
- 1 upload session memiliki banyak chunk
- 1 user memiliki banyak activity log

---

# 3. ERD Concept

```text
users 1 --- n folders
users 1 --- n files
folders 1 --- n files
files 1 --- n shares
users 1 --- n upload_sessions
upload_sessions 1 --- n upload_chunks
users 1 --- n activity_logs
users 1 --- 1 quota_policies
users 1 --- n oauth_accounts
users 1 --- n refresh_tokens
files 1 --- 1 trash_items (optional)
```

---

# 4. Tables Overview

## Core Tables
- users
- folders
- files
- shares

## Transfer Tables
- upload_sessions
- upload_chunks

## Security & Auth Tables
- oauth_accounts
- refresh_tokens

## Administration Tables
- activity_logs
- system_settings
- quota_policies

## Lifecycle Tables
- trash_items

---

# 5. Table Definitions

---

## 5.1 users

Menyimpan identitas pengguna yang login melalui OAuth/OIDC.

```sql
CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT NULL,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    status ENUM('active', 'disabled', 'pending') NOT NULL DEFAULT 'active',
    quota_bytes BIGINT UNSIGNED NOT NULL DEFAULT 10737418240,
    used_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_role (role),
    KEY idx_users_status (status),
    KEY idx_users_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Kolom penting
- `email`: identitas utama user
- `role`: admin atau user
- `quota_bytes`: batas storage
- `used_bytes`: total penggunaan storage
- `status`: status akun

### Catatan
- `email` harus unique
- `deleted_at` dipakai untuk soft delete
- `quota_bytes` default bisa diatur dari system settings

---

## 5.2 oauth_accounts

Menyimpan koneksi akun user dengan provider OAuth.

```sql
CREATE TABLE oauth_accounts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    provider ENUM('google', 'github', 'microsoft', 'oidc') NOT NULL,
    provider_subject VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255) NULL,
    access_token TEXT NULL,
    refresh_token TEXT NULL,
    expires_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_provider_subject (provider, provider_subject),
    KEY idx_oauth_user_id (user_id),
    KEY idx_oauth_provider (provider),
    CONSTRAINT fk_oauth_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Tujuan
- Menautkan user lokal dengan akun OAuth eksternal
- Memungkinkan satu user memiliki lebih dari satu provider login

---

## 5.3 folders

Menyimpan struktur folder hirarkis.

```sql
CREATE TABLE folders (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    parent_id BIGINT UNSIGNED NULL,
    owner_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    path TEXT NOT NULL,
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_folder_owner_parent_name (owner_id, parent_id, name),
    KEY idx_folders_owner_id (owner_id),
    KEY idx_folders_parent_id (parent_id),
    KEY idx_folders_deleted_at (deleted_at),
    CONSTRAINT fk_folders_parent
        FOREIGN KEY (parent_id) REFERENCES folders(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_folders_owner
        FOREIGN KEY (owner_id) REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Catatan
- `path` dapat menyimpan path lengkap secara denormalized untuk query cepat
- `parent_id` memungkinkan nested folder
- `uq_folder_owner_parent_name` mencegah nama folder duplikat di lokasi yang sama

---

## 5.4 files

Menyimpan metadata file.

```sql
CREATE TABLE files (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    folder_id BIGINT UNSIGNED NOT NULL,
    owner_id BIGINT UNSIGNED NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    extension VARCHAR(50) NULL,
    size_bytes BIGINT UNSIGNED NOT NULL,
    checksum_sha256 CHAR(64) NOT NULL,
    storage_path TEXT NOT NULL,
    storage_disk VARCHAR(50) NOT NULL DEFAULT 'local',
    version INT UNSIGNED NOT NULL DEFAULT 1,
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_files_folder_id (folder_id),
    KEY idx_files_owner_id (owner_id),
    KEY idx_files_checksum (checksum_sha256),
    KEY idx_files_deleted_at (deleted_at),
    KEY idx_files_created_at (created_at),
    CONSTRAINT fk_files_folder
        FOREIGN KEY (folder_id) REFERENCES folders(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_files_owner
        FOREIGN KEY (owner_id) REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Catatan
- `filename` adalah nama yang tampil di UI
- `original_filename` nama saat upload
- `storage_path` menunjuk lokasi fisik file
- `checksum_sha256` wajib untuk integritas file
- `version` dipakai untuk future file versioning

---

## 5.5 shares

Menyimpan share link untuk file atau folder.

```sql
CREATE TABLE shares (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    file_id BIGINT UNSIGNED NULL,
    folder_id BIGINT UNSIGNED NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    token VARCHAR(128) NOT NULL,
    password_hash VARCHAR(255) NULL,
    expires_at DATETIME NULL,
    max_downloads INT UNSIGNED NULL,
    download_count INT UNSIGNED NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_shares_token (token),
    KEY idx_shares_file_id (file_id),
    KEY idx_shares_folder_id (folder_id),
    KEY idx_shares_created_by (created_by),
    KEY idx_shares_expires_at (expires_at),
    CONSTRAINT fk_shares_file
        FOREIGN KEY (file_id) REFERENCES files(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_shares_folder
        FOREIGN KEY (folder_id) REFERENCES folders(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_shares_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_share_target
        CHECK (
            (file_id IS NOT NULL AND folder_id IS NULL) OR
            (file_id IS NULL AND folder_id IS NOT NULL)
        )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Catatan
- Share dapat menuju file atau folder, tetapi bukan keduanya sekaligus
- `token` adalah identitas publik share link
- `password_hash` opsional untuk share privat
- `max_downloads` untuk pembatasan akses

---

## 5.6 upload_sessions

Menyimpan sesi upload chunked/resumable.

```sql
CREATE TABLE upload_sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    folder_id BIGINT UNSIGNED NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    size_bytes BIGINT UNSIGNED NOT NULL,
    total_chunks INT UNSIGNED NOT NULL,
    uploaded_chunks INT UNSIGNED NOT NULL DEFAULT 0,
    chunk_size_bytes INT UNSIGNED NOT NULL,
    checksum_sha256 CHAR(64) NULL,
    status ENUM('pending', 'uploading', 'completed', 'failed', 'aborted') NOT NULL DEFAULT 'pending',
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_upload_sessions_user_id (user_id),
    KEY idx_upload_sessions_folder_id (folder_id),
    KEY idx_upload_sessions_status (status),
    KEY idx_upload_sessions_started_at (started_at),
    CONSTRAINT fk_upload_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_upload_sessions_folder
        FOREIGN KEY (folder_id) REFERENCES folders(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Fungsi
- Menyimpan metadata sementara saat upload belum selesai
- Mendukung resume upload
- Menyimpan progress upload

---

## 5.7 upload_chunks

Menyimpan status chunk yang telah diunggah.

```sql
CREATE TABLE upload_chunks (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id BIGINT UNSIGNED NOT NULL,
    chunk_index INT UNSIGNED NOT NULL,
    chunk_size_bytes INT UNSIGNED NOT NULL,
    chunk_hash CHAR(64) NULL,
    storage_path TEXT NOT NULL,
    status ENUM('pending', 'uploaded', 'merged', 'failed') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_session_chunk (session_id, chunk_index),
    KEY idx_upload_chunks_session_id (session_id),
    KEY idx_upload_chunks_status (status),
    CONSTRAINT fk_upload_chunks_session
        FOREIGN KEY (session_id) REFERENCES upload_sessions(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Catatan
- Setiap chunk punya index unik per sesi
- `storage_path` menunjuk file chunk sementara
- Setelah merge, chunk dapat dihapus

---

## 5.8 activity_logs

Mencatat aktivitas sistem.

```sql
CREATE TABLE activity_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id BIGINT UNSIGNED NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    metadata_json JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_activity_logs_user_id (user_id),
    KEY idx_activity_logs_action (action),
    KEY idx_activity_logs_resource_type (resource_type),
    KEY idx_activity_logs_created_at (created_at),
    CONSTRAINT fk_activity_logs_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Contoh action
- login
- logout
- upload_file
- download_file
- delete_file
- create_folder
- share_created
- share_revoked
- admin_disable_user

---

## 5.9 quota_policies

Menyimpan aturan quota yang bisa dipakai global maupun per role.

```sql
CREATE TABLE quota_policies (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    quota_bytes BIGINT UNSIGNED NOT NULL,
    applies_to_role ENUM('admin', 'user') NULL,
    applies_to_user_id BIGINT UNSIGNED NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_quota_role (applies_to_role),
    KEY idx_quota_user (applies_to_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Fungsi
- Default quota untuk user baru
- Quota khusus untuk user tertentu
- Quota berdasarkan role

---

## 5.10 refresh_tokens

Menyimpan refresh token yang aktif.

```sql
CREATE TABLE refresh_tokens (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_refresh_tokens_user_id (user_id),
    KEY idx_refresh_tokens_expires_at (expires_at),
    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Catatan
- Token disimpan dalam bentuk hash
- Mendukung token rotation

---

## 5.11 system_settings

Menyimpan pengaturan global.

```sql
CREATE TABLE system_settings (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    setting_key VARCHAR(150) NOT NULL,
    setting_value TEXT NULL,
    value_type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Contoh setting
- default_user_quota
- max_upload_size
- share_link_expiry_default
- trash_retention_days
- upload_chunk_size

---

## 5.12 trash_items

Menyimpan referensi item yang masuk trash.

```sql
CREATE TABLE trash_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    item_type ENUM('file', 'folder') NOT NULL,
    item_id BIGINT UNSIGNED NOT NULL,
    original_path TEXT NOT NULL,
    deleted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NULL,
    restored_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_trash_items_user_id (user_id),
    KEY idx_trash_items_item_type (item_type),
    KEY idx_trash_items_deleted_at (deleted_at),
    CONSTRAINT fk_trash_items_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Fungsi
- Soft delete
- Restore
- Auto cleanup setelah retensi habis

---

# 6. Index Strategy

## High Priority Indexes
- `users.email`
- `folders.owner_id`
- `folders.parent_id`
- `files.folder_id`
- `files.owner_id`
- `files.checksum_sha256`
- `shares.token`
- `upload_sessions.user_id`
- `upload_sessions.status`
- `activity_logs.created_at`

## Why Important
Karena sistem akan sering:
- mencari file berdasarkan nama/folder
- memeriksa ownership
- membaca share token
- mengecek status upload session
- menampilkan activity log terbaru

---

# 7. Relationship Rules

## users -> folders
One-to-many

## users -> files
One-to-many

## folders -> files
One-to-many

## files -> shares
One-to-many

## users -> upload_sessions
One-to-many

## upload_sessions -> upload_chunks
One-to-many

## users -> activity_logs
One-to-many

## users -> oauth_accounts
One-to-many

## users -> refresh_tokens
One-to-many

---

# 8. Soft Delete Strategy

Soft delete diterapkan untuk:
- users
- folders
- files

## Mekanisme
1. Record tidak langsung dihapus
2. Kolom `deleted_at` diisi
3. `is_deleted` di-set true jika digunakan
4. Data dipindahkan ke trash item
5. Cleanup job menghapus permanen setelah retensi

## Keuntungan
- Aman dari kesalahan user
- Mudah restore
- Mendukung audit

---

# 9. Quota Strategy

## Default Flow
- User baru mendapat quota default
- Quota diambil dari `system_settings` atau `quota_policies`
- Upload baru ditolak jika melebihi quota

## Perhitungan
```text
used_bytes + new_file_size <= quota_bytes
```

## Enforcement
- dicek saat upload start
- dicek saat upload complete
- dicek saat admin mengubah quota

---

# 10. File Integrity Strategy

## Aturan
- Setiap file wajib memiliki SHA-256
- Hash dihitung setelah merge chunk selesai
- Hash disimpan di `files.checksum_sha256`

## Tujuan
- Deteksi file rusak
- Mencegah mismatch saat resume
- Mendukung deduplication di masa depan

---

# 11. Upload Session Flow in Database

## Step
1. Buat `upload_sessions`
2. Set status `pending`
3. Upload chunk ke `upload_chunks`
4. Update `uploaded_chunks`
5. Jika selesai, ubah status menjadi `completed`
6. Create row pada `files`
7. Hapus chunk sementara
8. Log aktivitas

---

# 12. Sharing Flow in Database

## Step
1. User pilih file/folder
2. Sistem buat row di `shares`
3. Generate token unik
4. Simpan expiry/password jika ada
5. Hitung download_count saat link dipakai
6. Disable share jika direvoke

---

# 13. Sample ERD Text

```text
[users]
  |1
  |----< [folders]
  |----< [files]
  |----< [upload_sessions]
  |----< [activity_logs]
  |----< [oauth_accounts]
  |----< [refresh_tokens]
  |
  |----< [quota_policies] (optional via user assignment)

[folders]
  |1
  |----< [files]
  |----< [shares]

[files]
  |1
  |----< [shares]

[upload_sessions]
  |1
  |----< [upload_chunks]

[users]
  |1
  |----< [trash_items]
```

---

# 14. Migration Notes

## Initial Migration Order
1. users
2. oauth_accounts
3. quota_policies
4. folders
5. files
6. shares
7. upload_sessions
8. upload_chunks
9. refresh_tokens
10. activity_logs
11. system_settings
12. trash_items

## Future Migration Considerations
- file versioning table
- file preview cache table
- notification table
- collaboration table
- audit detail table

---

# 15. Recommended Seed Data

## system_settings seeds
- default_user_quota
- max_upload_size
- trash_retention_days
- share_link_expiry_default
- upload_chunk_size

## quota_policies seeds
- default user
- admin override

---

# 16. Summary

Skema database StorageHub dirancang untuk:
- ringan
- stabil
- mudah di-maintain
- cukup detail untuk scale-up
- siap mendukung FastAPI backend dan React frontend

Fokus utama tetap pada metadata file, session upload, sharing, quota, dan audit trail, sementara file fisik tetap disimpan di filesystem lokal.
