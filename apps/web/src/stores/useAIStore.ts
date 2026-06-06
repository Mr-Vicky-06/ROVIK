import { create } from "zustand";
import { predictIntelligence, type IntelligencePrediction } from "@/lib/api";

export interface OperationalAnomaly {
  id: string;
  type: "delay_risk" | "deviation" | "congestion" | "sla_breach";
  severity: "high" | "medium" | "low";
  description: string;
  timestamp: string;
  resolved: boolean;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  impactScore: number; // 0-100
  actionCode: string;
  orderId?: string;
  riderId?: string;
}

interface AIState {
  anomalies: OperationalAnomaly[];
  recommendations: AIRecommendation[];
  prediction: IntelligencePrediction | null;
  status: "idle" | "predicting" | "success" | "error";
  error: string | null;
  refreshPrediction: (distance?: number, stopsCount?: number) => Promise<void>;
  resolveAnomaly: (id: string) => void;
  applyRecommendation: (id: string) => void;
}

const initialAnomalies: OperationalAnomaly[] = [
  {
    id: "ANM-201",
    type: "congestion",
    severity: "high",
    description: "Outer Ring Road congestion increased average travel times by 14 minutes.",
    timestamp: "10:20 AM",
    resolved: false
  },
  {
    id: "ANM-202",
    type: "deviation",
    severity: "medium",
    description: "Rider 12 drifted 250 meters off optimal route in T Nagar.",
    timestamp: "10:18 AM",
    resolved: false
  }
];

const initialRecommendations: AIRecommendation[] = [
  {
    id: "REC-301",
    title: "Reassign Order #1029",
    description: "Reassigning Order #1029 to Rider 07 reduces SLA breach risk from 76% to 22%.",
    impactScore: 84,
    actionCode: "reassign_1029_07",
    orderId: "ORD-1029",
    riderId: "rider-07"
  },
  {
    id: "REC-302",
    title: "Workload Shift",
    description: "Anna Nagar cluster has 8 active deliveries and only 1 rider. Shift Rider 09 (van) to anna-nagar sector.",
    impactScore: 68,
    actionCode: "shift_rider_09"
  }
];

export const useAIStore = create<AIState>((set) => ({
  anomalies: initialAnomalies,
  recommendations: initialRecommendations,
  prediction: null,
  status: "idle",
  error: null,
  refreshPrediction: async (distance = 6.4, stopsCount = 3) => {
    set({ status: "predicting", error: null });
    try {
      // Mock parameter wrapper for fetch
      const prediction = await predictIntelligence({
        vehicleId: "rider-12",
        color: "#2563eb",
        totalDistanceKm: distance,
        stops: Array(stopsCount).fill({ id: "ORD-1029", lat: 13.0827, lng: 80.2707, etaMinutes: 24 })
      });
      set({ prediction, status: "success", error: null });
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Prediction failed"
      });
    }
  },
  resolveAnomaly: (id) => set((state) => ({
    anomalies: state.anomalies.map((anm) => anm.id === id ? { ...anm, resolved: true } : anm)
  })),
  applyRecommendation: (id) => set((state) => ({
    recommendations: state.recommendations.filter((rec) => rec.id !== id)
  }))
}));
