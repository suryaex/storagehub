from app.exceptions.base import AppException, NotFound


class QuotaExceeded(AppException):
    status_code = 413
    code = "QUOTA_EXCEEDED"


class InsufficientStorage(AppException):
    status_code = 507
    code = "INSUFFICIENT_STORAGE"


class FileNotFound(NotFound):
    code = "FILE_NOT_FOUND"


class FolderNotFound(NotFound):
    code = "FOLDER_NOT_FOUND"


class UploadSessionInvalid(AppException):
    status_code = 400
    code = "UPLOAD_SESSION_INVALID"


class ChecksumMismatch(AppException):
    status_code = 400
    code = "CHECKSUM_MISMATCH"


class ShareExpired(AppException):
    status_code = 410
    code = "SHARE_EXPIRED"


class ShareDisabled(AppException):
    status_code = 410
    code = "SHARE_DISABLED"
