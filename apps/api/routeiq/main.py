from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from routeiq.api.v1.router import api_router
from routeiq.core.config import get_settings
from routeiq.core.logging import configure_logging
from routeiq.api.v1.routes import optimization


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings = get_settings()
    configure_logging(settings.log_level)
    
    # Self-healing dynamic column migrations for spatial and metric support
    from sqlalchemy import text
    from routeiq.infrastructure.database.session import engine
    from routeiq.infrastructure.database.models import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("ALTER TABLE riders ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;"))
        await conn.execute(text("ALTER TABLE riders ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;"))
        await conn.execute(text("ALTER TABLE riders ADD COLUMN IF NOT EXISTS heading_degrees DOUBLE PRECISION;"))
        await conn.execute(text("ALTER TABLE riders ADD COLUMN IF NOT EXISTS speed_kmph DOUBLE PRECISION;"))
        await conn.execute(text("ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;"))
        await conn.execute(text("ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;"))
        await conn.execute(text("ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS service_minutes INTEGER DEFAULT 5;"))
        await conn.execute(text("ALTER TABLE order_import_jobs ADD COLUMN IF NOT EXISTS import_type VARCHAR(50);"))
        await conn.execute(text("ALTER TABLE order_import_jobs ADD COLUMN IF NOT EXISTS metadata_fields JSONB DEFAULT '{}';"))
        
    # Start Redis Pub/Sub WebSocket horizontal synchronizer task
    import asyncio
    from routeiq.realtime.connection_manager import connection_manager
    pubsub_task = asyncio.create_task(connection_manager.start_redis_listener())
    
    yield
    
    # Gracefully shut down the subscriber task
    pubsub_task.cancel()
    try:
        await pubsub_task
    except asyncio.CancelledError:
        pass


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        return response


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="AI-powered realtime logistics intelligence and dispatch orchestration platform.",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    # app.add_middleware(SecurityHeadersMiddleware)
    # app.add_middleware(RequestContextMiddleware)
    app.include_router(api_router, prefix=settings.api_v1_prefix)
    app.include_router(optimization.router, prefix=settings.api_v1_prefix)
    return app


app = create_app()
