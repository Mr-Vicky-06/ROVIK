from enum import StrEnum

from pydantic import BaseModel


class Role(StrEnum):
    ADMIN = "admin"
    DISPATCHER = "dispatcher"
    FLEET_MANAGER = "fleet_manager"
    DELIVERY_PARTNER = "delivery_partner"


class Principal(BaseModel):
    subject: str
    organization_id: str
    roles: set[Role]
