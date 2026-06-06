from routeiq.domain.geo import GeoPoint


class HaversineRoutingService:
    async def distance_km(self, origin: GeoPoint, destination: GeoPoint) -> float:
        return origin.distance_to_km(destination)
