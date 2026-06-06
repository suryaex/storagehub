-- ─────────────────────────────────────────────────────────────
-- StorageHub — MySQL 8 schema
-- File physical bytes live on the filesystem; this DB holds metadata.
-- ─────────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS storagehub
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE storagehub;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. users
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT NULL,
    role ENUM('admin','user') NOT NULL DEFAULT 'user',
    status ENUM('active','disabled','pending') NOT NULL DEFAULT 'active',
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

-- 2. oauth_accounts
CREATE TABLE IF NOT EXISTS oauth_accounts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    provider ENUM('google','github','microsoft','oidc','local') NOT NULL,
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
    CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. quota_policies
CREATE TABLE IF NOT EXISTS quota_policies (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    quota_bytes BIGINT UNSIGNED NOT NULL,
    applies_to_role ENUM('admin','user') NULL,
    applies_to_user_id BIGINT UNSIGNED NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_quota_role (applies_to_role),
    KEY idx_quota_user (applies_to_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. folders
CREATE TABLE IF NOT EXISTS folders (
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
    CONSTRAINT fk_folders_parent FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE,
    CONSTRAINT fk_folders_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. files
CREATE TABLE IF NOT EXISTS files (
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
    CONSTRAINT fk_files_folder FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
    CONSTRAINT fk_files_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. shares
CREATE TABLE IF NOT EXISTS shares (
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
    CONSTRAINT fk_shares_file FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    CONSTRAINT fk_shares_folder FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
    CONSTRAINT fk_shares_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_share_target CHECK (
        (file_id IS NOT NULL AND folder_id IS NULL) OR
        (file_id IS NULL AND folder_id IS NOT NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. upload_sessions
CREATE TABLE IF NOT EXISTS upload_sessions (
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
    status ENUM('pending','uploading','completed','failed','aborted') NOT NULL DEFAULT 'pending',
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_upload_sessions_user_id (user_id),
    KEY idx_upload_sessions_folder_id (folder_id),
    KEY idx_upload_sessions_status (status),
    KEY idx_upload_sessions_started_at (started_at),
    CONSTRAINT fk_upload_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_upload_sessions_folder FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. upload_chunks
CREATE TABLE IF NOT EXISTS upload_chunks (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id BIGINT UNSIGNED NOT NULL,
    chunk_index INT UNSIGNED NOT NULL,
    chunk_size_bytes INT UNSIGNED NOT NULL,
    chunk_hash CHAR(64) NULL,
    storage_path TEXT NOT NULL,
    status ENUM('pending','uploaded','merged','failed') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_session_chunk (session_id, chunk_index),
    KEY idx_upload_chunks_session_id (session_id),
    KEY idx_upload_chunks_status (status),
    CONSTRAINT fk_upload_chunks_session FOREIGN KEY (session_id) REFERENCES upload_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. refresh_tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_refresh_tokens_user_id (user_id),
    KEY idx_refresh_tokens_expires_at (expires_at),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
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
    CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. system_settings
CREATE TABLE IF NOT EXISTS system_settings (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    setting_key VARCHAR(150) NOT NULL,
    setting_value TEXT NULL,
    value_type ENUM('string','number','boolean','json') NOT NULL DEFAULT 'string',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. trash_items
CREATE TABLE IF NOT EXISTS trash_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    item_type ENUM('file','folder') NOT NULL,
    item_id BIGINT UNSIGNED NOT NULL,
    original_path TEXT NOT NULL,
    deleted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NULL,
    restored_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_trash_items_user_id (user_id),
    KEY idx_trash_items_item_type (item_type),
    KEY idx_trash_items_deleted_at (deleted_at),
    CONSTRAINT fk_trash_items_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
