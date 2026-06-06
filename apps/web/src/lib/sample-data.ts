export type StopPreview = {
  id: string;
  lat: number;
  lng: number;
  etaMinutes: number;
};

export type RoutePreview = {
  vehicleId: string;
  color: string;
  totalDistanceKm: number;
  stops: StopPreview[];
};

export const optimizationPreview: { routes: RoutePreview[] } = {
  routes: [
    {
      vehicleId: "Rider 12",
      color: "#2563eb",
      totalDistanceKm: 18.4,
      stops: [
        { id: "ORD-1001", lat: 12.9352, lng: 77.6245, etaMinutes: 14 },
        { id: "ORD-1004", lat: 12.9121, lng: 77.6446, etaMinutes: 28 },
        { id: "ORD-1011", lat: 12.9279, lng: 77.6271, etaMinutes: 39 }
      ]
    },
    {
      vehicleId: "Rider 7",
      color: "#22c55e",
      totalDistanceKm: 22.7,
      stops: [
        { id: "ORD-1002", lat: 12.9784, lng: 77.6408, etaMinutes: 17 },
        { id: "ORD-1007", lat: 12.9719, lng: 77.6412, etaMinutes: 26 },
        { id: "ORD-1014", lat: 13.0012, lng: 77.5995, etaMinutes: 44 }
      ]
    },
    {
      vehicleId: "Rider 3",
      color: "#8b5cf6",
      totalDistanceKm: 15.8,
      stops: [
        { id: "ORD-1016", lat: 12.9849, lng: 77.5533, etaMinutes: 12 },
        { id: "ORD-1019", lat: 12.9496, lng: 77.5968, etaMinutes: 24 },
        { id: "ORD-1022", lat: 12.9662, lng: 77.701, etaMinutes: 41 }
      ]
    }
  ]
};
