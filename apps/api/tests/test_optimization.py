import pytest

from routeiq.dependencies import get_optimize_routes_use_case
from routeiq.schemas.optimization import OptimizationRequest


@pytest.mark.asyncio
async def test_optimizer_assigns_orders_to_available_vehicles() -> None:
    request = OptimizationRequest.model_validate(
        {
            "depot": {"latitude": 12.9716, "longitude": 77.5946},
            "vehicles": [
                {
                    "id": "bike-01",
                    "vehicle_type": "bike",
                    "capacity": 2,
                    "start_location": {"latitude": 12.9716, "longitude": 77.5946},
                    "cost_per_km": 4.5,
                }
            ],
            "orders": [
                {
                    "id": "order-1",
                    "priority": 1,
                    "service_minutes": 5,
                    "dropoff": {"latitude": 12.9279, "longitude": 77.6271},
                }
            ],
        }
    )

    response = await get_optimize_routes_use_case().execute(request)

    assert response.total_distance_km > 0
    assert response.routes[0].stops[0].order_id == "order-1"
    assert response.unassigned_order_ids == []
