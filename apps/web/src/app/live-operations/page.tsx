"use client";

import { useState } from "react";
import {
  Compass,
  MapPin,
  Navigation,
  Radio,
  Rss,
  TrendingUp,
  AlertTriangle,
  Map,
  Zap,
  Route as RouteIcon,
  Focus,
  ShieldCheck,
  Activity
} from "lucide-react";
import { MapPanel } from "@/components/map-panel";
import { useFleetStore } from "@/stores/useFleetStore";
import { useOperationsStore } from "@/stores/operations-store";

import { useSettingsStore, cityProfiles, CityKey } from "@/stores/useSettingsStore";

export default function LiveOperationsPage() {
  const { riders } = useFleetStore();
  const { routes } = useOperationsStore();
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const settings = useSettingsStore();

  const activeCity = cityProfiles[settings.selectedCity];
  const riderList = Object.values(riders);

  return (
    <div className="relative flex h-[calc(100vh-2rem)] flex-col py-4 overflow-hidden">
      {/* Absolute Workspace Controls Header */}
      <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{settings.t("live_ops")}</h1>
          <p className="text-sm text-muted">{settings.t("live_ops_desc")}</p>
        </div>
        <div className="flex items-center gap-2">
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

          <span className="flex items-center gap-1.5 rounded-full border border-[#2563EB]/20 bg-[#2563EB]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">
            <Radio size={12} className="animate-pulse" />
            Telemetry: 5s Ping
          </span>
        </div>
      </header>

      {/* Full-bleed Map Box with Overlay HUD */}
      <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/10 glass-panel">
        <MapPanel routes={routes} />

        {/* Floating Telemetry List HUD Overlay */}
        <aside className="absolute right-4 top-4 z-[420] w-[340px] max-h-[calc(100%-2rem)] overflow-y-auto rounded-xl border border-white/10 bg-[#0A0E14]/90 p-4 backdrop-blur-md shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <Activity size={18} className="text-[#2563EB]" />
              <span className="text-sm font-bold text-white">{settings.t("active_fleet")}</span>
            </h2>
            <span className="text-[10px] text-muted">{riderList.length} Online</span>
          </div>

          <div className="space-y-2">
            {riderList.map((rider) => {
              const isSelected = selectedRiderId === rider.id;
              const hasDeviation = rider.routeDeviationM > 30;
              return (
                <article
                  key={rider.id}
                  onClick={() => setSelectedRiderId(rider.id)}
                  className={`flex flex-col gap-2 rounded-lg p-3 border transition duration-200 cursor-pointer ${
                    isSelected
                      ? "border-[#2563EB] bg-[#2563EB]/10"
                      : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${rider.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                      <span className="text-xs font-semibold text-white">{rider.name}</span>
                    </div>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white/80 font-mono">
                      {rider.vehicleType.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-[10px] text-muted">
                    <div className="flex items-center gap-1">
                      <Compass size={11} className="text-muted" />
                      <span>{rider.heading}°</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp size={11} className="text-muted" />
                      <span>{rider.speedKmph} km/h</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      <MapPin size={11} className="text-muted" />
                      <span className="truncate">{activeCity.name.split(',')[0]}</span>
                    </div>
                  </div>

                  {hasDeviation && (
                    <div className="mt-1 flex items-center gap-1.5 rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-[9px] font-semibold text-rose-400">
                      <AlertTriangle size={11} />
                      Rider drifted {rider.routeDeviationM}m off route!
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </aside>

        {/* Selected Rider Details Panel */}
        {selectedRiderId && (
          <div className="absolute left-4 bottom-4 z-[420] w-[300px] rounded-xl border border-white/10 bg-[#0A0E14]/90 p-4 backdrop-blur-md shadow-2xl">
            {(() => {
              const rider = riders[selectedRiderId];
              if (!rider) return null;
              return (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">{rider.name} Details</h3>
                    <button
                      onClick={() => setSelectedRiderId(null)}
                      className="text-[10px] text-muted hover:text-white"
                      type="button"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="text-xs space-y-1.5 text-muted">
                    <div>GPS Lat: <span className="text-white font-mono">{rider.latitude.toFixed(4)}</span></div>
                    <div>GPS Lng: <span className="text-white font-mono">{rider.longitude.toFixed(4)}</span></div>
                    <div>Operational Status: <span className="text-white capitalize">{rider.status}</span></div>
                    <div>Telemetry Health: <span className="text-emerald-400 font-semibold">100%</span></div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
