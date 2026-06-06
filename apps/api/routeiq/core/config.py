from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "ROVIK API"
    environment: str = "local"
    api_v1_prefix: str = "/api/v1"
    log_level: str = "INFO"
    database_url: str = "postgresql+asyncpg://rovik:rovik@localhost:5432/rovik"
    redis_url: str = "redis://localhost:6379/0"
    backend_cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    routing_provider: str = "haversine"
    optimization_provider: str = "ortools"
    supabase_jwt_secret: str = "local-development-secret"
    supabase_jwt_audience: str = "authenticated"
    auth_disabled: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
