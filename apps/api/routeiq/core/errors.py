from fastapi import HTTPException, status


class ROVIKError(HTTPException):
    def __init__(self, code: str, message: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> None:
        super().__init__(status_code=status_code, detail={"code": code, "message": message})


class PermissionDenied(ROVIKError):
    def __init__(self, message: str = "Insufficient permissions") -> None:
        super().__init__("permission_denied", message, status.HTTP_403_FORBIDDEN)
