"use client";

import {
  Cpu,
  Key,
  Sliders,
  Sparkles,
  Users
} from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 py-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Configuration</h1>
          <p className="text-sm text-muted">Configure routing parameters, OR-Tools solver limits, and AI copilot prompts</p>
        </div>
      </header>

      {/* Settings Grid */}
      <section className="grid gap-6 md:grid-cols-2">
        {/* Sliders Constants */}
        <article className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Sliders size={16} className="text-[#2563EB]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Fleet Orchestration Delays</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white">
                <span>Dispatch Coalescing Duration</span>
                <span className="font-semibold">60s</span>
              </div>
              <div className="h-1.5 w-full rounded bg-white/10 overflow-hidden">
                <div className="h-full w-2/5 bg-[#2563EB]" />
              </div>
              <p className="text-[10px] text-muted">Buffer time before sending raw order intakes to the solver.</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white">
                <span>Rider Telemetry Ping Frequency</span>
                <span className="font-semibold">5s</span>
              </div>
              <div className="h-1.5 w-full rounded bg-white/10 overflow-hidden">
                <div className="h-full w-1/5 bg-[#2563EB]" />
              </div>
              <p className="text-[10px] text-muted">Rate of GPS location update broadcasts in rider mobile app.</p>
            </div>
          </div>
        </article>

        {/* Solver Constraints */}
        <article className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Cpu size={16} className="text-[#22C55E]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Combinatorial Solver Limits</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white">
                <span>OR-Tools Search Time Limit</span>
                <span className="font-semibold">3.0s</span>
              </div>
              <div className="h-1.5 w-full rounded bg-white/10 overflow-hidden">
                <div className="h-full w-3/5 bg-[#22C55E]" />
              </div>
              <p className="text-[10px] text-muted">Maximum processing time allocated to solver convergence loops.</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white">
                <span>Workload Balancing Factor</span>
                <span className="font-semibold">0.8</span>
              </div>
              <div className="h-1.5 w-full rounded bg-white/10 overflow-hidden">
                <div className="h-full w-4/5 bg-[#22C55E]" />
              </div>
              <p className="text-[10px] text-muted">Penalty weight balancing order counts across active riders.</p>
            </div>
          </div>
        </article>

        {/* AI Prompt Tuning */}
        <article className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Sparkles size={16} className="text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">AI Copilot Parameters</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-white">System Prompt Grounding Template</label>
              <textarea
                defaultValue="You are ROVIK Copilot, a next-generation logistics intelligence system. Ground your recommendations strictly in the active OR-Tools matrix and OSRM GIS networks."
                className="w-full h-20 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div className="flex justify-between text-xs text-white">
              <span>Agent Temperature</span>
              <span className="font-mono text-[#2563EB]">0.15 (Strict deterministic)</span>
            </div>
          </div>
        </article>

        {/* Security Access Control (RBAC) */}
        <article className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Key size={16} className="text-violet-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Security & Policies</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center rounded-lg bg-white/[0.02] border border-white/5 p-3">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-violet-400" />
                <span className="text-xs font-semibold text-white">Supabase Authentication Claims</span>
              </div>
              <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                ENABLED
              </span>
            </div>

            <p className="text-[10px] text-muted leading-relaxed">
              API routes require strict validation against tenant-separated RBAC claims. System admins can create user keys and bind them to distinct dispatch privileges.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
