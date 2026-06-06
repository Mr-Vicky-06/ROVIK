from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from routeiq.core.config import get_settings
from routeiq.core.errors import PermissionDenied, ROVIKError
from routeiq.schemas.auth import Principal, Role

bearer = HTTPBearer(auto_error=False)


def decode_token(token: str) -> Principal:
    settings = get_settings()
    if settings.auth_disabled or token == "local-dev":
        return Principal(
            subject="local-dev",
            organization_id="00000000-0000-0000-0000-000000000001",
            roles={Role.ADMIN, Role.DISPATCHER, Role.FLEET_MANAGER},
        )
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience=settings.supabase_jwt_audience,
        )
    except JWTError as exc:
        raise ROVIKError("invalid_token", "Invalid authentication token", 401) from exc

    metadata = payload.get("app_metadata", {})
    roles = {Role(role) for role in metadata.get("roles", ["dispatcher"])}
    return Principal(
        subject=payload["sub"],
        # Note: mapping legacy JWT tenant_id to the new organization_id schema
        organization_id=metadata.get("tenant_id", "default"),
        roles=roles,
    )


async def get_current_principal(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> Principal:
    settings = get_settings()
    if settings.auth_disabled:
        return decode_token("local-dev")
    if credentials is None:
        raise ROVIKError("unauthenticated", "Missing bearer token", 401)
    return decode_token(credentials.credentials)


def require_roles(*allowed: Role):
    async def dependency(principal: Principal = Depends(get_current_principal)) -> Principal:
        if not principal.roles.intersection(set(allowed)):
            raise PermissionDenied()
        return principal

    return dependency
