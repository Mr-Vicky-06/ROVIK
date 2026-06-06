import { create } from "zustand";

export interface Delivery {
  id: string;
  externalId: string;
  priority: number; // 1 (Highest) to 5 (Lowest)
  status: "pending" | "assigned" | "transit" | "completed" | "failed";
  latitude: number;
  longitude: number;
  slaMinutes: number;
  assignedRiderId: string | null;
  area: string;
  createdAt: string;
}

interface DispatchState {
  deliveries: Record<string, Delivery>;
  addDelivery: (delivery: Delivery) => void;
  assignDelivery: (orderId: string, riderId: string | null) => void;
  updateDeliveryStatus: (orderId: string, status: Delivery["status"]) => void;
  setDeliveries: (deliveries: Delivery[]) => void;
}

const initialDeliveries: Delivery[] = [
  { id: "ORD-1029", externalId: "EXT-9901", priority: 1, status: "assigned", latitude: 13.0401, longitude: 80.2460, slaMinutes: 30, assignedRiderId: "rider-12", area: "T Nagar", createdAt: new Date().toISOString() },
  { id: "ORD-1028", externalId: "EXT-9902", priority: 2, status: "assigned", latitude: 13.0011, longitude: 80.2520, slaMinutes: 45, assignedRiderId: "rider-07", area: "Mylapore", createdAt: new Date().toISOString() },
  { id: "ORD-1027", externalId: "EXT-9903", priority: 3, status: "completed", latitude: 12.9810, longitude: 80.2201, slaMinutes: 60, assignedRiderId: "rider-03", area: "Velachery", createdAt: new Date().toISOString() },
  { id: "ORD-1026", externalId: "EXT-9904", priority: 1, status: "pending", latitude: 13.0801, longitude: 80.2801, slaMinutes: 20, assignedRiderId: null, area: "Anna Nagar", createdAt: new Date().toISOString() },
  { id: "ORD-1025", externalId: "EXT-9905", priority: 4, status: "pending", latitude: 13.0090, longitude: 80.2580, slaMinutes: 75, assignedRiderId: null, area: "Guindy", createdAt: new Date().toISOString() },
  { id: "ORD-1024", externalId: "EXT-9906", priority: 2, status: "pending", latitude: 12.9650, longitude: 80.2190, slaMinutes: 40, assignedRiderId: null, area: "Adyar", createdAt: new Date().toISOString() }
];

export const useDispatchStore = create<DispatchState>((set) => ({
  deliveries: initialDeliveries.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {}),
  addDelivery: (delivery) => set((state) => ({
    deliveries: { ...state.deliveries, [delivery.id]: delivery }
  })),
  assignDelivery: (orderId, riderId) => set((state) => {
    if (!state.deliveries[orderId]) return state;
    return {
      deliveries: {
        ...state.deliveries,
        [orderId]: {
          ...state.deliveries[orderId],
          assignedRiderId: riderId,
          status: riderId ? "assigned" : "pending"
        }
      }
    };
  }),
  updateDeliveryStatus: (orderId, status) => set((state) => {
    if (!state.deliveries[orderId]) return state;
    return {
      deliveries: {
        ...state.deliveries,
        [orderId]: { ...state.deliveries[orderId], status }
      }
    };
  }),
  setDeliveries: (deliveries) => set({
    deliveries: deliveries.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {})
  })
}));
