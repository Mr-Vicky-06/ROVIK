"use client";

import {
  Activity,
  AlertTriangle,
  Bot,
  BrainCircuit,
  MessageSquare,
  Sparkles,
  Zap
} from "lucide-react";
import { useAIStore } from "@/stores/useAIStore";
import { useDispatchStore } from "@/stores/useDispatchStore";

export default function AIOpsPage() {
  const { anomalies, recommendations, prediction, applyRecommendation, refreshPrediction } = useAIStore();
  const { assignDelivery } = useDispatchStore();

  const handleApplyOverride = (recId: string, actionCode: string, orderId?: string, riderId?: string) => {
    if (orderId && riderId) {
      // Optimistically apply manual assignment override via Zustand useDispatchStore
      assignDelivery(orderId, riderId);
    }
    // Remove the applied recommendation from AI queue
    applyRecommendation(recId);
  };

  const activeAnomalies = anomalies.filter((a) => !a.resolved);

  return (
    <div className="space-y-6 py-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">AI Operations Center</h1>
          <p className="text-sm text-muted">Realtime anomaly detection, predictive risk assessments, and auto-dispatch options</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-[#2563EB]/20 bg-[#2563EB]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">
            <Bot size={12} />
            Context: Grounded
          </span>
        </div>
      </header>

      {/* Core Grid */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* Left Column: Active Recommendations & Prompts */}
        <div className="space-y-6">
          {/* Active AI Recommendation HUD */}
          <article className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#2563EB] flex items-center gap-2">
                <Sparkles size={14} />
                Predictive Recommendations ({recommendations.length})
              </h2>
              <span className="text-[10px] text-muted">Dispatcher review required</span>
            </div>

            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{rec.title}</span>
                      <span className="rounded bg-[#22C55E]/10 border border-[#22C55E]/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                        Impact +{rec.impactScore}%
                      </span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">{rec.description}</p>
                  </div>
                  <button
                    onClick={() => handleApplyOverride(rec.id, rec.actionCode, rec.orderId, rec.riderId)}
                    className="flex-shrink-0 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 px-4 py-2 text-xs font-semibold text-white transition"
                    type="button"
                  >
                    Apply Override
                  </button>
                </div>
              ))}
              {recommendations.length === 0 && (
                <div className="text-center text-xs text-muted py-10">No recommendation overrides pending.</div>
              )}
            </div>
          </article>

          {/* Context synthesis grounding */}
          <article className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2 border-b border-white/5 pb-2">
              <BrainCircuit size={14} />
              Operational Memory Grounding Context
            </h2>
            <p className="text-xs text-white/70 leading-relaxed">
              Unlike classical chat interfaces, ROVIK AI translates raw spatial pings, traffic metrics, and OR-Tools outputs into structured, semantic contexts.
            </p>
            <div className="rounded-xl bg-white/[0.01] border border-white/5 p-4 text-[10px] font-mono space-y-2 text-muted">
              <div>System State: <span className="text-white">Grounding compiled (14 features injected)</span></div>
              <div>pgvector Memory: <span className="text-white">Active (128-dimensional local mapping)</span></div>
              <div>Semantic Grounding Query: <span className="text-[#2563EB]">{"SELECT * FROM search_memory('chennai_traffic_delay')"}</span></div>
            </div>
          </article>
        </div>

        {/* Right Column: Anomalies & Explanations */}
        <aside className="space-y-6">
          {/* Realtime Anomaly monitor */}
          <article className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="mb-2 flex items-center gap-2 border-b border-white/5 pb-2">
              <AlertTriangle size={18} className="text-rose-500" />
              <h2 className="text-sm font-bold text-white">Operational Anomaly Feed</h2>
            </div>

            <div className="space-y-3">
              {activeAnomalies.map((anm) => (
                <div key={anm.id} className={`p-3 rounded-xl border flex gap-3 ${anm.severity === "high" ? "border-rose-500/20 bg-rose-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-xs font-bold text-white">
                      <span>{anm.type.toUpperCase()}</span>
                      <span className="text-[10px] text-muted">{anm.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-white/80 leading-relaxed">{anm.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* Custom conversational queries */}
          <article className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare size={14} className="text-[#2563EB]" />
              Natural Language Dispatch Queries
            </h2>
            <p className="text-[11px] text-muted leading-relaxed">
              Use natural language to inquire about fleet conditions or commit manual routing assignments:
            </p>
            <div className="flex gap-2">
              <input
                placeholder="Query e.g., Which riders are nearest T Nagar?"
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-muted focus:outline-none focus:border-[#2563EB]"
                type="text"
              />
              <button
                className="rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-bold text-white hover:bg-[#2563EB]/90"
                type="button"
              >
                Send
              </button>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
