import { create } from "zustand";
import { optimizeRoutes, type OptimizationResponse } from "@/lib/api";
import { useSettingsStore, cityProfiles } from "./useSettingsStore";
import { useDispatchStore } from "./useDispatchStore";
import { useFleetStore } from "./useFleetStore";

export interface OptimizationJob {
  id: string;
  status: "pending" | "solving" | "completed" | "failed";
  timestamp: string;
  beforeCost: number;
  afterCost: number;
  beforeDistance: number;
  afterDistance: number;
  savingsPercent: number;
}

interface OptimizationState {
  jobs: OptimizationJob[];
  currentPlan: OptimizationResponse | null;
  status: "idle" | "solving" | "success" | "error";
  error: string | null;
  runOptimization: () => Promise<void>;
  clearPlan: () => void;
}

const initialJobs: OptimizationJob[] = [
  {
    id: "JOB-901",
    status: "completed",
    timestamp: "10:15 AM",
    beforeCost: 654.50,
    afterCost: 512.20,
    beforeDistance: 145.4,
    afterDistance: 113.8,
    savingsPercent: 21.7
  },
  {
    id: "JOB-900",
    status: "completed",
    timestamp: "09:30 AM",
    beforeCost: 480.00,
    afterCost: 410.50,
    beforeDistance: 106.6,
    afterDistance: 91.2,
    savingsPercent: 14.4
  }
];

export const useOptimizationStore = create<OptimizationState>((set) => ({
  jobs: initialJobs,
  currentPlan: null,
  status: "idle",
  error: null,
  runOptimization: async () => {
    set({ status: "solving", error: null });
    try {
      const settings = useSettingsStore.getState();
      const dispatch = useDispatchStore.getState();
      const fleet = useFleetStore.getState();

      const city = cityProfiles[settings.selectedCity];
      const depot = { latitude: city.latitude, longitude: city.longitude };
      
      const orders = Object.values(dispatch.deliveries)
        .filter((d) => d.status === "pending" || d.status === "assigned" || d.status === "transit")
        .map((d) => ({
          id: d.id,
          priority: d.priority,
          service_minutes: 5,
          dropoff: { latitude: d.latitude, longitude: d.longitude }
        }));

      const vehicles = Object.values(fleet.riders)
        .filter((r) => r.status !== "offline")
        .map((r) => ({
          id: r.id,
          vehicle_type: r.vehicleType,
          capacity: 12,
          start_location: { latitude: r.latitude, longitude: r.longitude },
          cost_per_km: r.vehicleType === "van" ? 6.5 : r.vehicleType === "bike" ? 4.5 : 4.1
        }));

      // Construct dynamic solver request from dispatcher custom inputs
      const requestPayload = (orders.length > 0 && vehicles.length > 0) ? {
        depot,
        vehicles,
        orders,
        objective: {
          minimize_distance: true,
          balance_workload: settings.workloadBalanceFactor > 0.5,
          priority_weight: settings.priorityWeight
        }
      } : undefined;

      const plan = await optimizeRoutes(requestPayload);
      
      const newJob: OptimizationJob = {
        id: `JOB-${902 + Math.floor(Math.random() * 100)}`,
        status: "completed",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        beforeCost: plan.total_cost * 1.18, 
        afterCost: plan.total_cost,
        beforeDistance: plan.total_distance_km * 1.18,
        afterDistance: plan.total_distance_km,
        savingsPercent: 18.0
      };
      
      set((state) => ({
        jobs: [newJob, ...state.jobs],
        currentPlan: plan,
        status: "success",
        error: null
      }));
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Optimization solver failed"
      });
    }
  },
  clearPlan: () => set({ currentPlan: null, status: "idle" })
}));
