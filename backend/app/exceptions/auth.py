from app.exceptions.base import AppException, Unauthorized


class OAuthError(AppException):
    status_code = 400
    code = "OAUTH_ERROR"


class InvalidToken(Unauthorized):
    code = "INVALID_TOKEN"


class TokenExpired(Unauthorized):
    code = "TOKEN_EXPIRED"


class UserDisabled(Unauthorized):
    code = "USER_DISABLED"
