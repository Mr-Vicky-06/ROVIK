import type { RoutePreview } from "@/lib/sample-data";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export type OptimizationResponse = {
  routes: Array<{
    vehicle_id: string;
    stops: Array<{
      sequence: number;
      order_id: string;
      location: {
        latitude: number;
        longitude: number;
      };
      distance_from_previous_km: number;
      eta_minutes: number;
    }>;
    total_distance_km: number;
    total_cost: number;
    estimated_duration_minutes: number;
  }>;
  unassigned_order_ids: string[];
  total_distance_km: number;
  total_cost: number;
};

export type IntelligencePrediction = {
  model_version: string;
  eta_minutes: number;
  delay_probability: number;
  eta_model: string;
  delay_model: string;
  confidence: string;
};

const sampleOptimizationRequest = {
  depot: { latitude: 12.9716, longitude: 77.5946 },
  vehicles: [
    {
      id: "Rider 12",
      vehicle_type: "bike",
      capacity: 5,
      start_location: { latitude: 12.9716, longitude: 77.5946 },
      cost_per_km: 4.5
    },
    {
      id: "Rider 7",
      vehicle_type: "scooter",
      capacity: 6,
      start_location: { latitude: 12.9352, longitude: 77.6245 },
      cost_per_km: 5.2
    },
    {
      id: "Rider 3",
      vehicle_type: "ev_scooter",
      capacity: 4,
      start_location: { latitude: 12.9849, longitude: 77.5533 },
      cost_per_km: 4.1
    }
  ],
  orders: [
    {
      id: "ORD-1029",
      priority: 1,
      service_minutes: 4,
      dropoff: { latitude: 12.9279, longitude: 77.6271 }
    },
    {
      id: "ORD-1030",
      priority: 2,
      service_minutes: 5,
      dropoff: { latitude: 12.9784, longitude: 77.6408 }
    },
    {
      id: "ORD-1031",
      priority: 3,
      service_minutes: 6,
      dropoff: { latitude: 13.0012, longitude: 77.5995 }
    },
    {
      id: "ORD-1032",
      priority: 2,
      service_minutes: 5,
      dropoff: { latitude: 12.9496, longitude: 77.5968 }
    },
    {
      id: "ORD-1033",
      priority: 4,
      service_minutes: 5,
      dropoff: { latitude: 12.9662, longitude: 77.701 }
    }
  ],
  objective: {
    minimize_distance: true,
    balance_workload: true,
    priority_weight: 1.4
  }
};

export async function optimizeRoutes(customRequest?: any): Promise<OptimizationResponse> {
  const response = await fetch(`${API_BASE}/optimize/fleet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(customRequest ?? sampleOptimizationRequest)
  });
  if (!response.ok) {
    throw new Error(`Optimization failed with ${response.status}`);
  }
  return response.json() as Promise<OptimizationResponse>;
}

export async function predictIntelligence(route?: RoutePreview): Promise<IntelligencePrediction> {
  const distance = route?.totalDistanceKm ?? 6.4;
  const response = await fetch(`${API_BASE}/intelligence/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      distance_km: Math.max(1, distance),
      traffic_level: 0.62,
      weather_severity: 0.08,
      road_complexity: 0.48,
      rider_workload: route?.stops.length ?? 3,
      delivery_density: 18,
      hour_of_day: new Date().getHours(),
      day_of_week: new Date().getDay(),
      predicted_eta_min: route?.stops.at(-1)?.etaMinutes ?? 24,
      promised_eta_min: 35,
      rider_avg_speed_kmph: 22,
      rider_idle_ratio: 0.05,
      rider_completion_rate: 0.92,
      area_delay_rate: 0.18,
      area_avg_traffic_level: 0.52,
      vehicle_type: "bike",
      area: "T Nagar"
    })
  });
  if (!response.ok) {
    throw new Error(`Prediction failed with ${response.status}`);
  }
  return response.json() as Promise<IntelligencePrediction>;
}

export function mapOptimizationToPreview(plan: OptimizationResponse): RoutePreview[] {
  const colors = ["#2563eb", "#22c55e", "#8b5cf6", "#f59e0b", "#22c8e8"];
  return plan.routes.map((route, index) => ({
    vehicleId: route.vehicle_id,
    color: colors[index % colors.length],
    totalDistanceKm: route.total_distance_km,
    stops: route.stops.map((stop) => ({
      id: stop.order_id,
      lat: stop.location.latitude,
      lng: stop.location.longitude,
      etaMinutes: stop.eta_minutes
    }))
  }));
}
