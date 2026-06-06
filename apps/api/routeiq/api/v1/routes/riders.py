from uuid import uuid4
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from datetime import datetime, UTC

from routeiq.infrastructure.database.session import get_session
from routeiq.infrastructure.database.models import RiderModel, EventModel
from routeiq.infrastructure.events.redis_event_bus import RedisEventPublisher
from routeiq.domain.events import EventType, OperationalEvent
from routeiq.schemas.auth import Principal, Role
from routeiq.schemas.common import AcceptedResponse, Page
from routeiq.schemas.operations import RiderCreate, RiderLocationUpdate, RiderRead
from routeiq.security.auth import require_roles

router = APIRouter()
_publisher = RedisEventPublisher()


@router.post("", response_model=AcceptedResponse, status_code=202)
async def create_rider(
    payload: RiderCreate,
    db: AsyncSession = Depends(get_session),
    principal: Principal = Depends(require_roles(Role.ADMIN, Role.FLEET_MANAGER)),
) -> AcceptedResponse:
    rider_id = str(uuid4())
    lat = payload.start_location.latitude if payload.start_location else None
    lng = payload.start_location.longitude if payload.start_location else None
    
    rider = RiderModel(
        id=rider_id,
        organization_id=principal.organization_id,
        external_id=payload.external_id,
        vehicle_type=payload.vehicle_type,
        capacity=payload.capacity,
        status="available",
        latitude=lat,
        longitude=lng
    )
    db.add(rider)
    await db.commit()
    return AcceptedResponse(id=rider_id, status="accepted")


@router.get("", response_model=Page[RiderRead])
async def list_riders(
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_session),
    principal: Principal = Depends(require_roles(Role.ADMIN, Role.DISPATCHER, Role.FLEET_MANAGER)),
) -> Page[RiderRead]:
    query = select(RiderModel).where(RiderModel.organization_id == principal.organization_id).offset(offset).limit(limit)
    result = await db.execute(query)
    riders = result.scalars().all()
    
    total_query = select(RiderModel).where(RiderModel.organization_id == principal.organization_id)
    total_result = await db.execute(total_query)
    total = len(total_result.scalars().all())

    items = []
    for r in riders:
        loc = None
        if r.latitude is not None and r.longitude is not None:
            from routeiq.schemas.optimization import GeoPointSchema
            loc = GeoPointSchema(latitude=r.latitude, longitude=r.longitude)
        
        items.append(
            RiderRead(
                id=r.id,
                external_id=r.external_id,
                vehicle_type=r.vehicle_type,
                capacity=r.capacity,
                status=r.status,
                start_location=loc
            )
        )
    return Page(items=items, total=total, limit=limit, offset=offset)


@router.post("/locations", response_model=AcceptedResponse, status_code=202)
async def update_location(
    payload: RiderLocationUpdate,
    db: AsyncSession = Depends(get_session),
    principal: Principal = Depends(
        require_roles(Role.ADMIN, Role.DISPATCHER, Role.FLEET_MANAGER, Role.DELIVERY_PARTNER)
    ),
) -> AcceptedResponse:
    # 1. Apply GPS Telemetry Filter (Stationary & Noise Compression / Smoothing)
    from routeiq.infrastructure.routing.telemetry_filter import telemetry_filter
    should_filter, smoothed_lat, smoothed_lng = await telemetry_filter.filter_and_smooth(
        payload.rider_id, 
        payload.location.latitude, 
        payload.location.longitude, 
        payload.speed_kmph
    )
    
    if should_filter:
        # Discard ping to save DB writes and connection load
        return AcceptedResponse(id="filtered_redundant_ping", status="accepted")

    # 2. Look up rider by ID or external_id
    query = select(RiderModel).where(
        (RiderModel.id == payload.rider_id) | (RiderModel.external_id == payload.rider_id)
    ).where(RiderModel.organization_id == principal.organization_id)
    result = await db.execute(query)
    rider = result.scalar_one_or_none()
    
    if rider is None:
        # Self-healing auto-creation to support seamless simulation triggers
        rider = RiderModel(
            id=str(uuid4()),
            organization_id=principal.organization_id,
            external_id=payload.rider_id,
            vehicle_type="bicycle",
            capacity=1,
            status="available"
        )
        db.add(rider)
        await db.flush()

    # 3. Update status and smoothed coordinate metrics
    rider.latitude = smoothed_lat
    rider.longitude = smoothed_lng
    rider.heading_degrees = payload.heading_degrees
    rider.speed_kmph = payload.speed_kmph
    await db.commit()

    # 4. Log spatial ping to the geography-indexed telemetry table
    try:
        telemetry_sql = text("""
            INSERT INTO rider_telemetry (organization_id, rider_id, location, speed_kmph, heading_degrees, state)
            VALUES (:organization_id, :rider_id, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :speed, :heading, 'active')
        """)
        await db.execute(
            telemetry_sql,
            {
                "organization_id": principal.organization_id,
                "rider_id": rider.id,
                "lng": smoothed_lng,
                "lat": smoothed_lat,
                "speed": payload.speed_kmph,
                "heading": payload.heading_degrees,
            }
        )
        await db.commit()
    except Exception:
        pass # Graceful fallback if database schema isn't fully PostGIS configured

    # 5. Execute GIS Geofencing Arrivals & Route Deviation Audits
    from routeiq.application.dispatch.deviation_service import deviation_service
    await deviation_service.audit_rider_position(db, rider.id, smoothed_lat, smoothed_lng, principal.organization_id)

    # 6. Save to SQL Operational Event table
    event = OperationalEvent(
        event_type=EventType.RIDER_LOCATION_UPDATED,
        organization_id=principal.organization_id,
        payload={
            "rider_id": payload.rider_id,
            "location": {"latitude": smoothed_lat, "longitude": smoothed_lng},
            "heading_degrees": payload.heading_degrees,
            "speed_kmph": payload.speed_kmph
        },
    )
    event_model = EventModel(
        id=event.event_id,
        organization_id=principal.organization_id,
        event_type=event.event_type,
        payload=event.payload,
        occurred_at=datetime.now(UTC)
    )
    db.add(event_model)
    await db.commit()

    # 7. Publish to Redis event channel
    try:
        await _publisher.publish(event)
    except Exception:
        pass # Fallback if Redis is momentarily unreachable

    return AcceptedResponse(id=event.event_id, status="accepted")
