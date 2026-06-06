from fastapi import APIRouter

from routeiq.api.v1.routes import dispatch, events, health, intelligence, optimizations, riders, tracking, copilot, orders, ml_predictions, analytics

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(optimizations.router, prefix="/optimize", tags=["optimizations"])
api_router.include_router(dispatch.router, prefix="/dispatch", tags=["dispatch"])
api_router.include_router(riders.router, prefix="/riders", tags=["riders"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(intelligence.router, prefix="/intelligence", tags=["intelligence"])
api_router.include_router(tracking.router, tags=["tracking"])
api_router.include_router(copilot.router)
api_router.include_router(ml_predictions.router, prefix="/ml", tags=["ml-predictions"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
