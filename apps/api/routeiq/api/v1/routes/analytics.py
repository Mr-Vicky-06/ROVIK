from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from routeiq.infrastructure.database.session import get_session
from routeiq.infrastructure.database.models import OrderModel, RouteModel, RiderModel, EventModel
from routeiq.schemas.auth import Principal, Role
from routeiq.security.auth import require_roles

router = APIRouter()

@router.get("/metrics")
async def get_realtime_metrics(
    db: AsyncSession = Depends(get_session),
    principal: Principal = Depends(require_roles(Role.ADMIN, Role.DISPATCHER, Role.FLEET_MANAGER)),
):
    org_id = principal.organization_id
    
    # 1. Total Volume
    volume_res = await db.execute(select(func.count(OrderModel.id)).where(OrderModel.organization_id == org_id))
    total_orders = volume_res.scalar_one()
    
    # 2. Completed Orders (Revenue driver)
    delivered_res = await db.execute(select(func.count(OrderModel.id)).where(OrderModel.organization_id == org_id, OrderModel.status == "delivered"))
    delivered_orders = delivered_res.scalar_one()
    
    # 3. SLA Breaches (Alerts)
    alerts_res = await db.execute(select(func.count(EventModel.id)).where(EventModel.organization_id == org_id, EventModel.event_type == "SLA_ALERT_GENERATED"))
    sla_breaches = alerts_res.scalar_one()
    
    # 4. Fleet Utilization
    total_riders_res = await db.execute(select(func.count(RiderModel.id)).where(RiderModel.organization_id == org_id))
    active_riders_res = await db.execute(select(func.count(RiderModel.id)).where(RiderModel.organization_id == org_id, RiderModel.status.in_(["available", "busy"])))
    
    total_riders = total_riders_res.scalar_one()
    active_riders = active_riders_res.scalar_one()
    utilization = round((active_riders / total_riders * 100) if total_riders > 0 else 0, 1)
    
    # Calculate mocked revenue based on delivered items (Assume avg order value $15 for logic)
    total_revenue = delivered_orders * 15.00
    
    # SLA accuracy percentage
    sla_accuracy = round(100 - ((sla_breaches / total_orders * 100) if total_orders > 0 else 0), 1)
    
    # Fuel Savings (Distance * 1.5L / 100km * $3/L avg)
    distance_res = await db.execute(select(func.sum(RouteModel.total_distance_km)).where(RouteModel.organization_id == org_id))
    total_distance = distance_res.scalar_one() or 0
    # Hypothetical optimization savings of 12% over naive routing
    saved_distance = total_distance * 0.12
    fuel_savings = round((saved_distance / 100) * 1.5 * 3, 2)
    
    return {
        "total_volume": total_orders,
        "completed_deliveries": delivered_orders,
        "active_fleet_utilization": utilization,
        "sla_accuracy_percent": sla_accuracy,
        "sla_breaches_count": sla_breaches,
        "total_revenue_usd": total_revenue,
        "fuel_savings_usd": fuel_savings
    }
