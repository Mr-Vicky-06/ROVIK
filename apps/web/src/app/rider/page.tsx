"use client";

import { useState } from "react";
import {
  Bell,
  Box,
  CircleDot,
  Compass,
  MapPin,
  Map,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useDispatchStore, type Delivery } from "@/stores/useDispatchStore";

export default function RiderPage() {
  const { deliveries, updateDeliveryStatus } = useDispatchStore();
  const [isOnline, setIsOnline] = useState(true);
  const [activeRiderId] = useState("rider-12");

  // Get active delivery assigned to this rider
  const assignedDeliveries = Object.values(deliveries).filter(
    (d) => d.assignedRiderId === activeRiderId && d.status === "assigned"
  );
  
  const currentOrder = assignedDeliveries[0] as Delivery | undefined;

  const handleCompleteDelivery = (orderId: string) => {
    // Complete the delivery optimistically in the useDispatchStore
    updateDeliveryStatus(orderId, "completed");
  };

  return (
    <div className="mx-auto max-w-md min-h-screen bg-[#05080d] text-white flex flex-col font-sans border-x border-white/5 relative">
      {/* Mobile Top Header HUD */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0A0E14]/85 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <CircleDot size={14} className={isOnline ? "text-emerald-500 animate-pulse" : "text-rose-500"} />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            {isOnline ? "ONLINE: RIDER-12" : "OFFLINE"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`rounded-full px-3 py-1 text-[10px] font-bold border transition ${
              isOnline
                ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            }`}
            type="button"
          >
            {isOnline ? "Go Offline" : "Go Online"}
          </button>
          <Bell size={16} className="text-muted" />
        </div>
      </header>

      {/* Main Responsive Body */}
      <main className="flex-1 p-5 space-y-5 overflow-y-auto">
        {isOnline ? (
          currentOrder ? (
            <div className="space-y-5">
              {/* Active Route Card */}
              <article className="rounded-2xl border border-white/10 bg-[#0A0E14] p-5 space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <Box size={16} className="text-[#2563EB]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Active Task</span>
                  </div>
                  <span className="text-[10px] font-bold text-rose-400 font-mono">SLA {currentOrder.slaMinutes}m</span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-white">{currentOrder.id}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <MapPin size={12} className="text-[#2563EB] flex-shrink-0" />
                    <span className="truncate">{currentOrder.area} Cluster</span>
                  </div>
                </div>

                {/* Spatial Grid Placeholder */}
                <div className="h-40 rounded-xl bg-[#081320] relative overflow-hidden flex flex-col items-center justify-center border border-white/5 rovik-grid">
                  <div className="absolute left-[38%] top-[30%] h-12 w-12 rounded-full bg-[#2563EB]/40 blur-xl" />
                  <Map className="text-[#2563EB]/40 mb-1 animate-pulse" size={24} />
                  <span className="text-[10px] text-muted tracking-wider uppercase font-bold">Route Nav mesh loaded</span>
                </div>

                {/* Complete Button Trigger */}
                <button
                  onClick={() => handleCompleteDelivery(currentOrder.id)}
                  className="w-full rounded-xl bg-[#2563EB] hover:bg-[#2563EB]/95 border border-[#2563EB]/20 py-3 text-xs font-bold text-white transition tracking-wide flex items-center justify-center gap-2"
                  type="button"
                >
                  <CheckCircle2 size={16} />
                  Mark Delivery Complete
                </button>
              </article>

              {/* Driving Directions */}
              <article className="rounded-xl border border-white/5 bg-white/[0.01] p-4 flex gap-3">
                <Compass className="text-muted flex-shrink-0" size={18} />
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Next Step</h3>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Head south-east on Chennai Ring Road toward dropoff location coordinates. Expected traffic delay: +2 minutes.
                  </p>
                </div>
              </article>
            </div>
          ) : (
            <div className="text-center py-16 space-y-3">
              <CheckCircle2 className="mx-auto text-emerald-400" size={40} />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">All Clear!</h2>
              <p className="text-xs text-muted max-w-xs mx-auto leading-relaxed">
                You do not have any active delivery assignments. Awaiting dispatch order assignment from command center.
              </p>
            </div>
          )
        ) : (
          <div className="text-center py-16 space-y-3">
            <AlertCircle className="mx-auto text-rose-500" size={40} />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">You are Offline</h2>
            <p className="text-xs text-muted max-w-xs mx-auto leading-relaxed">
              Switch back to online mode in the top right to start receiving order dispatches and telemetry route plans.
            </p>
          </div>
        )}
      </main>

      {/* Navigation Footer */}
      <footer className="px-6 py-4 border-t border-white/5 bg-[#0A0E14]/85 text-center text-[10px] text-muted font-mono flex justify-between">
        <span>GPS Accuracy: 3.5m</span>
        <span>Version: v1.0.8</span>
      </footer>
    </div>
  );
}
