"use client";

import { useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  Box,
  BrainCircuit,
  RadioTower,
  Route,
  ShieldCheck,
  Signal,
  Users,
  Zap
} from "lucide-react";
import { MapPanel } from "@/components/map-panel";
import { useSettingsStore, cityProfiles, CityKey } from "@/stores/useSettingsStore";
import { useFleetStore } from "@/stores/useFleetStore";
import { useDispatchStore } from "@/stores/useDispatchStore";
import { useAIStore } from "@/stores/useAIStore";
import { useOperationsStore } from "@/stores/operations-store";
import { CopilotChat } from "@/components/copilot/CopilotChat";
import { OptimizationPanel } from "@/components/optimization/OptimizationPanel";

export default function OverviewPage() {
  const { riders } = useFleetStore();
  const { deliveries } = useDispatchStore();
  const { prediction, anomalies, refreshPrediction } = useAIStore();
  const { routes } = useOperationsStore();
  const settings = useSettingsStore();

  const activeCity = cityProfiles[settings.selectedCity];

  useEffect(() => {
    // Ground operational predictor context on boot
    void refreshPrediction();
  }, [refreshPrediction, settings.selectedCity]);

  // Aggregate reactive live KPIs
  const deliveryList = Object.values(deliveries);
  const riderList = Object.values(riders);

  const totalOrders = deliveryList.length;
  const completedOrders = deliveryList.filter((d) => d.status === "completed").length;
  const inProgressOrders = deliveryList.filter((d) => d.status === "assigned" || d.status === "transit").length;
  const delayedOrders = deliveryList.filter((d) => d.status === "failed").length; // Mock fail as delay for logic consistency
  const activeRiders = riderList.filter((r) => r.status === "active").length;
  const activeAnomalies = anomalies.filter((a) => !a.resolved);

  const metrics = [
    { label: settings.t("total_orders"), value: totalOrders, icon: Box, accent: "text-[#2563EB]" },
    { label: settings.t("completed"), value: completedOrders, icon: ShieldCheck, accent: "text-emerald-500" },
    { label: settings.t("in_progress"), value: inProgressOrders, icon: Route, accent: "text-amber-500" },
    { label: settings.t("delayed"), value: delayedOrders, icon: Zap, accent: "text-rose-500" },
    { label: settings.t("active_riders"), value: activeRiders, icon: Users, accent: "text-[#22C55E]" },
    { label: settings.t("sla"), value: "94.2%", icon: Activity, accent: "text-violet-500" }
  ];

  return (
    <div className="space-y-6 py-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{settings.t("overview")}</h1>
          <p className="text-sm text-muted">{settings.t("overview_subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Dynamic Global Region Selector */}
          <select
            value={settings.selectedCity}
            onChange={(e) => settings.setCity(e.target.value as CityKey)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#2563EB]"
          >
            {Object.values(cityProfiles).map((city) => (
              <option key={city.key} value={city.key} className="bg-[#0A0E14] text-white">
                {city.name}
              </option>
            ))}
          </select>
          
          <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs">
            <RadioTower size={14} className="text-emerald-500 animate-pulse" />
            {settings.t("core_active")}
          </span>
        </div>
      </header>

      {/* KPI Dashboard */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className="glass-panel rounded-xl p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">{metric.label}</span>
                <div className="rounded-lg bg-white/5 p-2">
                  <Icon size={16} className={metric.accent} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{metric.value}</div>
            </article>
          );
        })}
      </section>

      {/* Main Map Mesh Grid (60-70% dominance) */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="glass-panel overflow-hidden rounded-2xl border border-white/10">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <div>
              <h2 className="text-sm font-semibold text-white">{settings.t("live_ops")}</h2>
              <p className="text-xs text-muted">{settings.t("live_ops_subtitle")}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider">
              {settings.t("chennai_core")}
            </div>
          </div>
          <div className="relative h-full w-full">
            <OptimizationPanel />
            <MapPanel routes={routes} />
          </div>
        </div>

        {/* Sidebar Operational Intelligence Column */}
        <div className="space-y-6">
          {/* AI Operational Context Summary */}
          <article className="glass-panel rounded-2xl p-5 border border-white/10">
            <div className="mb-4 flex items-center gap-2">
              <BrainCircuit size={18} className="text-[#2563EB]" />
              <h2 className="text-sm font-bold text-white">{settings.t("ai_insight")}</h2>
            </div>
            {prediction ? (
              <div className="space-y-4">
                <p className="text-xs leading-relaxed text-white/70">
                  ROVIK selected model predicts a <span className="font-semibold text-white">{prediction.eta_minutes} minute</span> ETA 
                  with <span className="font-semibold text-rose-500">{(prediction.delay_probability * 100).toFixed(0)}%</span> delay probability 
                  for the active Chennai cluster. Confidence is scored as <span className="text-emerald-400 font-semibold">{prediction.confidence}</span>.
                </p>
                <div className="rounded-lg bg-white/[0.03] p-3 text-[10px] space-y-1.5 text-muted font-mono">
                  <div>ETA Predictor: <span className="text-white">{prediction.eta_model}</span></div>
                  <div>Classifier: <span className="text-white">{prediction.delay_model}</span></div>
                  <div>Artifact: <span className="text-white">{prediction.model_version.slice(0, 15)}</span></div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted">{settings.t("injecting_telemetry")}</p>
            )}
            <button
              onClick={() => void refreshPrediction()}
              className="mt-4 w-full rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 py-2.5 text-xs font-semibold text-white transition"
              type="button"
            >
              {settings.t("refresh_predictor")}
            </button>
          </article>

          {/* Incidents and Anomaly Stream */}
          <article className="glass-panel rounded-2xl p-5 border border-white/10">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-500" />
              <h2 className="text-sm font-bold text-white">{settings.t("incidents")}</h2>
            </div>
            <div className="space-y-3">
              {activeAnomalies.length > 0 ? (
                activeAnomalies.map((anm) => (
                  <div key={anm.id} className="flex gap-3 border-l-2 border-rose-500 bg-rose-500/5 p-3 rounded-r-lg">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-semibold text-white">
                        <span>{anm.type.toUpperCase()}</span>
                        <span className="text-[10px] text-muted">{anm.timestamp}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-white/80 leading-relaxed">{anm.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-muted py-6">{settings.t("no_anomalies")}</div>
              )}
            </div>
          </article>
        </div>
      </section>

      {/* Bottom Timeline Event Stream */}
      <section className="glass-panel rounded-2xl p-5 border border-white/10">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted">{settings.t("high_freq_timeline")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/5 p-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 grid place-items-center text-xs font-bold text-emerald-500">C</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-white">Order #1029</div>
              <div className="truncate text-[10px] text-muted">Assigned to Rider 12</div>
            </div>
            <span className="text-[9px] text-muted font-mono">09:40 AM</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/5 p-3">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 grid place-items-center text-xs font-bold text-blue-400">P</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-white">Order #1028</div>
              <div className="truncate text-[10px] text-muted">Picked up by Rider 07</div>
            </div>
            <span className="text-[9px] text-muted font-mono">09:38 AM</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/5 p-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 grid place-items-center text-xs font-bold text-emerald-500">D</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-white">Order #1027</div>
              <div className="truncate text-[10px] text-muted">Delivered successfully</div>
            </div>
            <span className="text-[9px] text-muted font-mono">09:36 AM</span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/5 p-3">
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 border border-rose-500/20 grid place-items-center text-xs font-bold text-rose-500">R</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-white">Order #1026</div>
              <div className="truncate text-[10px] text-muted">Route re-optimized</div>
            </div>
            <span className="text-[9px] text-muted font-mono">09:34 AM</span>
          </div>
        </div>
      </section>
      <CopilotChat />
    </div>
  );
}
