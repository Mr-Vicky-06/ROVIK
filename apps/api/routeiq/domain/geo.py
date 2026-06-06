from dataclasses import dataclass
from math import asin, cos, radians, sin, sqrt


@dataclass(frozen=True)
class GeoPoint:
    latitude: float
    longitude: float

    def distance_to_km(self, other: "GeoPoint") -> float:
        earth_radius_km = 6371.0088
        d_lat = radians(other.latitude - self.latitude)
        d_lon = radians(other.longitude - self.longitude)
        lat1 = radians(self.latitude)
        lat2 = radians(other.latitude)
        a = sin(d_lat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(d_lon / 2) ** 2
        return 2 * earth_radius_km * asin(sqrt(a))
