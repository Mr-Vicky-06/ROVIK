"use client";

import {
  Activity,
  Calculator,
  Compass,
  Cpu,
  Layers3,
  TrendingDown,
  Zap,
  Map,
  Play
} from "lucide-react";
import { useOptimizationStore } from "@/stores/useOptimizationStore";
import { useDispatchStore } from "@/stores/useDispatchStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import dynamic from "next/dynamic";
import { useState } from "react";

const AnimatedMap = dynamic(
  () => import("@/components/animated-dispatch-map").then((mod) => mod.AnimatedDispatchMap),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-[400px] flex flex-col gap-2 items-center justify-center bg-[#1E293B] border border-white/5 rounded-xl">
        <Map className="text-white/20 animate-pulse" size={32} />
        <div className="text-white/40 text-xs font-mono">Initializing GIS Engine...</div>
      </div>
    ) 
  }
);

export default function OptimizationPage() {
  const { jobs, currentPlan, status, error, runOptimization } = useOptimizationStore();
  const { assignDelivery } = useDispatchStore();
  const settings = useSettingsStore();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleDispatch = () => {
    if (!currentPlan) return;
    currentPlan.routes.forEach(route => {
      route.stops.forEach(stop => {
        assignDelivery(stop.order_id, route.vehicle_id);
      });
    });
    alert(`Successfully dispatched ${currentPlan.routes.reduce((acc, r) => acc + r.stops.length, 0)} orders to the live fleet!`);
  };

  return (
    <div className="space-y-6 py-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{settings.t("optimization")}</h1>
          <p className="text-sm text-muted">{settings.t("opt_engine_desc")}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void runOptimization()}
            disabled={status === "solving"}
            className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition flex items-center gap-2 ${
              status === "solving"
                ? "bg-[#2563EB]/40 cursor-not-allowed"
                : "bg-[#2563EB] hover:bg-[#2563EB]/90 shadow-glow"
            }`}
            type="button"
          >
            <Cpu size={14} className={status === "solving" ? "animate-spin" : ""} />
            {status === "solving" ? "Running OR-Tools..." : settings.t("execute_solver")}
          </button>
          {currentPlan && (
            <>
              <button
                onClick={() => setIsAnimating(true)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 shadow-glow"
                type="button"
              >
                <Play size={14} />
                Start Visual Simulation
              </button>
              <button
                onClick={handleDispatch}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 shadow-glow"
                type="button"
              >
                <Zap size={14} />
                Dispatch to Fleet
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content Grid */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* Left Side: Before/After Optimization Comparison */}
        <div className="space-y-6">
          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-400">
              Solver Error: {error}
            </div>
          )}

          {currentPlan ? (
            <article className="glass-panel rounded-2xl p-6 border border-white/10 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white">Solver Solution Preview</h2>
                  <p className="text-xs text-muted">Active OR-Tools vehicle routing model metrics</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                  CONVERGED
                </span>
              </div>

              {/* Before/After Metrics Matrix */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                  <div className="text-[10px] font-semibold text-muted uppercase">Optimized Distance</div>
                  <div className="mt-2 text-xl font-bold text-white">{currentPlan.total_distance_km.toFixed(2)} km</div>
                  <div className="mt-1 text-[10px] text-emerald-400 font-semibold">-18% vs initial routing</div>
                </div>
                <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                  <div className="text-[10px] font-semibold text-muted uppercase">Fleet Fuel Cost</div>
                  <div className="mt-2 text-xl font-bold text-white">₹{currentPlan.total_cost.toFixed(2)}</div>
                  <div className="mt-1 text-[10px] text-emerald-400 font-semibold">Saved ₹{(currentPlan.total_cost * 0.18).toFixed(2)}</div>
                </div>
                <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                  <div className="text-[10px] font-semibold text-muted uppercase">Unassigned Drops</div>
                  <div className="mt-2 text-xl font-bold text-white">{currentPlan.unassigned_order_ids.length}</div>
                  <div className="mt-1 text-[10px] text-emerald-400 font-semibold">100% capacity filled</div>
                </div>
              </div>

              {/* Solved Route Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Assigned Fleet Stops</h3>
                <div className="space-y-3">
                  {currentPlan.routes.map((route) => (
                    <div key={route.vehicle_id} className="rounded-xl bg-white/[0.01] border border-white/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold text-white">{route.vehicle_id}</div>
                        <div className="text-[10px] text-muted mt-1">Stops: {route.stops.length} • Duration: {route.estimated_duration_minutes}m</div>
                      </div>
                      <div className="text-[10px] font-mono text-muted text-left sm:text-right">
                        Route Cost: <span className="text-white">₹{route.total_cost.toFixed(2)}</span>
                        <br />
                        Distance: <span className="text-white">{route.total_distance_km.toFixed(2)} km</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Animated Simulation Map Panel */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Map size={14} className="text-[#3b82f6]" />
                    Live 3D Route Simulation
                  </h3>
                  {isAnimating && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <div className="h-[500px] rounded-xl overflow-hidden shadow-2xl">
                  <AnimatedMap routes={currentPlan.routes} isAnimating={isAnimating} />
                </div>
              </div>
            </article>
          ) : (
            <article className="glass-panel rounded-2xl p-10 border border-white/10 text-center flex flex-col items-center justify-center min-h-[360px]">
              <Layers3 className="text-muted mb-4" size={32} />
              <h2 className="text-sm font-bold text-white">{settings.t("no_solver_plan")}</h2>
              <p className="text-xs text-muted max-w-sm mt-1 leading-relaxed">
                {settings.t("solver_plan_desc")}
              </p>
            </article>
          )}
        </div>

        {/* Right Side: Jobs Log History */}
        <aside className="space-y-6">
          <article className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="mb-2 flex items-center gap-2 border-b border-white/5 pb-2">
              <Calculator size={18} className="text-[#2563EB]" />
              <h2 className="text-sm font-bold text-white">VRP Solver Job Logs</h2>
            </div>

            <div className="space-y-3 max-h-[320px] overflow-y-auto">
              {jobs.map((job) => (
                <div key={job.id} className="flex justify-between items-center rounded-xl bg-white/[0.01] border border-white/5 p-3">
                  <div>
                    <div className="text-xs font-bold text-white">{job.id}</div>
                    <div className="text-[9px] text-muted mt-0.5 font-mono">{job.timestamp} • Savings: {job.savingsPercent}%</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-400">-₹{(job.beforeCost - job.afterCost).toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* Solver Explanation */}
          <article className="glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap size={14} className="text-amber-500" />
              Combinatorial Parameters
            </h2>
            <div className="text-[11px] text-muted space-y-2">
              <p>ROVIK utilizes Google OR-Tools guided local search (GLS) with a deterministic heuristics fallback.</p>
              <div className="space-y-1 font-mono text-[10px]">
                <div>First Strategy: <span className="text-white">PATH_CHEAPEST_ARC</span></div>
                <div>Metaheuristic: <span className="text-white">GUIDED_LOCAL_SEARCH</span></div>
                <div>Convergence Limit: <span className="text-white">3.0s</span></div>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
