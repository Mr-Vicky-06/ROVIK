"use client";

import { create } from "zustand";

import {
  mapOptimizationToPreview,
  optimizeRoutes,
  predictIntelligence,
  type IntelligencePrediction,
  type OptimizationResponse
} from "@/lib/api";
import { optimizationPreview, type RoutePreview } from "@/lib/sample-data";

type RunState = "idle" | "running" | "ready" | "error";

type OperationsState = {
  routes: RoutePreview[];
  plan: OptimizationResponse | null;
  prediction: IntelligencePrediction | null;
  status: RunState;
  lastUpdated: string | null;
  error: string | null;
  refreshPrediction: () => Promise<void>;
  runOptimization: () => Promise<void>;
};

export const useOperationsStore = create<OperationsState>((set, get) => ({
  routes: optimizationPreview.routes,
  plan: null,
  prediction: null,
  status: "idle",
  lastUpdated: null,
  error: null,
  refreshPrediction: async () => {
    try {
      const prediction = await predictIntelligence(get().routes[0]);
      set({ prediction, lastUpdated: new Date().toLocaleTimeString(), error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Prediction failed" });
    }
  },
  runOptimization: async () => {
    set({ status: "running", error: null });
    try {
      const plan = await optimizeRoutes();
      const routes = mapOptimizationToPreview(plan);
      const prediction = await predictIntelligence(routes[0]);
      set({
        routes,
        plan,
        prediction,
        status: "ready",
        lastUpdated: new Date().toLocaleTimeString(),
        error: null
      });
    } catch (error) {
      set({
        status: "error",
        error: error instanceof Error ? error.message : "Optimization failed"
      });
    }
  }
}));
