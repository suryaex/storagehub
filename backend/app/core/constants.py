"""Shared constants."""

# Activity log actions
ACTION_LOGIN = "login"
ACTION_LOGOUT = "logout"
ACTION_UPLOAD_FILE = "upload_file"
ACTION_DOWNLOAD_FILE = "download_file"
ACTION_DELETE_FILE = "delete_file"
ACTION_RESTORE_FILE = "restore_file"
ACTION_CREATE_FOLDER = "create_folder"
ACTION_DELETE_FOLDER = "delete_folder"
ACTION_SHARE_CREATED = "share_created"
ACTION_SHARE_REVOKED = "share_revoked"
ACTION_ADMIN_UPDATE_USER = "admin_update_user"
ACTION_ADMIN_DISABLE_USER = "admin_disable_user"

# Resource types
RESOURCE_FILE = "file"
RESOURCE_FOLDER = "folder"
RESOURCE_SHARE = "share"
RESOURCE_USER = "user"
RESOURCE_SESSION = "session"

ROOT_FOLDER_NAME = "root"

# Default system settings (seeded on init if missing)
DEFAULT_SETTINGS = {
    "default_user_quota": ("10737418240", "number"),
    "max_upload_size": ("53687091200", "number"),
    "trash_retention_days": ("30", "number"),
    "share_link_expiry_default": ("", "string"),
    "upload_chunk_size": ("8388608", "number"),
}
