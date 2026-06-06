import { create } from "zustand";

export interface Rider {
  id: string;
  name: string;
  vehicleType: "bike" | "scooter" | "ev_scooter" | "van";
  status: "idle" | "active" | "offline";
  latitude: number;
  longitude: number;
  speedKmph: number;
  heading: number;
  routeDeviationM: number;
}

interface FleetState {
  riders: Record<string, Rider>;
  updateRiderLocation: (id: string, lat: number, lng: number, speed: number, heading: number, deviation?: number) => void;
  setRiders: (riders: Rider[]) => void;
  setRiderStatus: (id: string, status: "idle" | "active" | "offline") => void;
}

// Initial mockup data grounded in real Chennai coordinates from collect-demo-data
const initialRiders: Rider[] = [
  { id: "rider-12", name: "Rider 12", vehicleType: "bike", status: "active", latitude: 13.0827, longitude: 80.2707, speedKmph: 22, heading: 90, routeDeviationM: 15 },
  { id: "rider-07", name: "Rider 07", vehicleType: "scooter", status: "active", latitude: 13.0358, longitude: 80.2445, speedKmph: 27, heading: 180, routeDeviationM: 5 },
  { id: "rider-03", name: "Rider 03", vehicleType: "ev_scooter", status: "idle", latitude: 12.9865, longitude: 80.2180, speedKmph: 0, heading: 0, routeDeviationM: 0 },
  { id: "rider-09", name: "Rider 09", vehicleType: "van", status: "active", latitude: 13.0067, longitude: 80.2578, speedKmph: 20, heading: 270, routeDeviationM: 45 }
];

export const useFleetStore = create<FleetState>((set) => ({
  riders: initialRiders.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {}),
  updateRiderLocation: (id, lat, lng, speed, heading, deviation = 0) => set((state) => {
    if (!state.riders[id]) {
      // Auto-register rider if not existing
      return {
        riders: {
          ...state.riders,
          [id]: {
            id,
            name: id.toUpperCase(),
            vehicleType: "bike",
            status: "active",
            latitude: lat,
            longitude: lng,
            speedKmph: speed,
            heading,
            routeDeviationM: deviation
          }
        }
      };
    }
    return {
      riders: {
        ...state.riders,
        [id]: {
          ...state.riders[id],
          latitude: lat,
          longitude: lng,
          speedKmph: speed,
          heading,
          routeDeviationM: deviation,
          status: speed > 0 ? "active" : "idle"
        }
      }
    };
  }),
  setRiders: (riders) => set({
    riders: riders.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {})
  }),
  setRiderStatus: (id, status) => set((state) => {
    if (!state.riders[id]) return state;
    return {
      riders: {
        ...state.riders,
        [id]: { ...state.riders[id], status }
      }
    };
  })
}));
