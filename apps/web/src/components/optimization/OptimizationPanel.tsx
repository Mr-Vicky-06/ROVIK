"use client";
import { useState } from "react";
import { Route, Play, CheckCircle2, AlertCircle } from "lucide-react";

import { optimizeRoutes } from "@/lib/api";

export function OptimizationPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await optimizeRoutes();
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel absolute left-6 top-6 z-10 w-80 rounded-2xl border border-white/10 p-5 backdrop-blur-xl bg-[#0A0E14]/90 shadow-2xl">
      <div className="mb-4 flex items-center gap-2 text-white">
        <Route size={20} className="text-[#22C55E]" />
        <h2 className="font-bold">OR-Tools Fleet Optimizer</h2>
      </div>

      <p className="mb-6 text-xs text-muted leading-relaxed">
        Trigger the capacitated vehicle routing algorithm to calculate the most efficient clusters for 10 pending orders across 3 riders.
      </p>

      <button
        onClick={handleOptimize}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-[#22C55E] py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? (
          <span className="animate-pulse">Optimizing Matrix...</span>
        ) : (
          <>
            <Play size={16} /> Run Optimization
          </>
        )}
      </button>

      {result && (
        <div className="mt-5 space-y-3 rounded-xl bg-white/5 p-4 border border-white/5">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 size={16} />
            <span className="text-xs font-bold">Optimization Complete</span>
          </div>
          <div className="text-xs text-white/80">
            Total Fleet Distance: <span className="font-bold text-white">{result.total_distance_km?.toFixed(2) || "0.00"} km</span>
          </div>
          <div className="space-y-1">
            {result.routes.map((r: any) => (
              <div key={r.vehicle_id} className="text-[10px] text-muted font-mono">
                Rider {r.vehicle_id}: {r.stops?.length || 0} stops ({r.total_distance_km?.toFixed(2) || "0"}km)
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-5 flex items-start gap-2 rounded-xl bg-rose-500/10 p-3 text-rose-500 border border-rose-500/20">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span className="text-xs leading-relaxed">{error}</span>
        </div>
      )}
    </div>
  );
}
