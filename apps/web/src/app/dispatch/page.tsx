"use client";

import { useState } from "react";
import {
  Box,
  Command,
  HelpCircle,
  ShieldAlert,
  Users,
  CheckCircle2,
  AlertTriangle,
  Inbox
} from "lucide-react";
import { useSettingsStore, cityProfiles, CityKey } from "@/stores/useSettingsStore";
import { useDispatchStore } from "@/stores/useDispatchStore";
import { useFleetStore } from "@/stores/useFleetStore";

export default function DispatchPage() {
  const { deliveries, assignDelivery } = useDispatchStore();
  const { riders } = useFleetStore();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const settings = useSettingsStore();

  const deliveryList = Object.values(deliveries);
  const riderList = Object.values(riders);

  // Split queues logically
  const pendingOrders = deliveryList.filter((d) => d.status === "pending");
  const activeOrders = deliveryList.filter((d) => d.status === "assigned" || d.status === "transit");
  const completedOrders = deliveryList.filter((d) => d.status === "completed" || d.status === "failed");

  // Get current order metadata
  const selectedOrder = selectedOrderId ? deliveries[selectedOrderId] : null;

  return (
    <div className="space-y-6 py-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{settings.t("dispatch")}</h1>
          <p className="text-sm text-muted">{settings.t("dispatch_desc")}</p>
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

          <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
            <Command size={14} className="text-[#2563EB]" />
            Control Mode
          </span>
        </div>
      </header>

      {/* Main Core Grid */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* Left Side: Order Intake Queues */}
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Queue 1: Pending Order Queue */}
            <article className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                  <ShieldAlert size={14} />
                  {settings.t("intake_queue")} ({pendingOrders.length})
                </h2>
                <span className="text-[10px] text-muted">Awaiting Rider</span>
              </div>

              <div className="space-y-3">
                {pendingOrders.map((order) => {
                  const isSelected = selectedOrderId === order.id;
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`flex justify-between items-center rounded-xl p-3 border transition duration-200 cursor-pointer ${
                        isSelected
                          ? "border-[#2563EB] bg-[#2563EB]/10"
                          : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{order.id}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${order.priority === 1 ? "bg-rose-500/20 text-rose-400" : "bg-white/10 text-muted"}`}>
                            P{order.priority}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted truncate mt-1">{order.area}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-rose-400">SLA: {order.slaMinutes}m</span>
                      </div>
                    </div>
                  );
                })}
                {pendingOrders.length === 0 && (
                  <div className="text-center text-xs text-muted py-8">All orders successfully dispatched.</div>
                )}
              </div>
            </article>

            {/* Queue 2: Active Deliveries */}
            <article className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                  <Box size={14} />
                  {settings.t("active_transit_queue")} ({activeOrders.length})
                </h2>
                <span className="text-[10px] text-muted">In Progress</span>
              </div>

              <div className="space-y-3">
                {activeOrders.map((order) => {
                  const isSelected = selectedOrderId === order.id;
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`flex justify-between items-center rounded-xl p-3 border transition duration-200 cursor-pointer ${
                        isSelected
                          ? "border-[#2563EB] bg-[#2563EB]/10"
                          : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{order.id}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold capitalize">
                            {order.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted truncate mt-1">{order.area}</div>
                      </div>
                      <div className="text-right text-[10px] text-muted font-mono">
                        Rider: {order.assignedRiderId?.split("-").at(-1) ?? "None"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </div>

          {/* Queue 3: Completed Records */}
          <article className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2 border-b border-white/5 pb-2">
              <CheckCircle2 size={14} />
              {settings.t("shift_archive_log")} ({completedOrders.length})
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {completedOrders.map((order) => (
                <div key={order.id} className="flex justify-between items-center rounded-lg bg-white/[0.01] border border-white/5 p-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white">{order.id}</div>
                    <div className="text-[10px] text-muted truncate mt-0.5">{order.area}</div>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${order.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </div>

        {/* Right Side: Rider Coordination & Assignment HUD */}
        <aside className="space-y-6">
          <article className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
              <ShieldAlert size={18} className="text-rose-500" />
              <h2 className="text-sm font-bold text-white">{settings.t("manual_overrides")}</h2>
            </div>

            {selectedOrder ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-[#2563EB]/5 border border-[#2563EB]/20 p-4 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-white">
                    <span>Active Selection: {selectedOrder.id}</span>
                    <span className="text-rose-400">SLA {selectedOrder.slaMinutes}m</span>
                  </div>
                  <p className="text-[11px] text-muted">
                    Order is designated in <span className="text-white">{selectedOrder.area}</span>. Below are available riders ranked by proximity parameters. Select a rider to apply matching rules.
                  </p>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {riderList
                    .filter((r) => r.status !== "offline")
                    .map((rider) => {
                      const isCurrentlyAssigned = selectedOrder.assignedRiderId === rider.id;
                      return (
                        <div
                          key={rider.id}
                          onClick={() => assignDelivery(selectedOrder.id, isCurrentlyAssigned ? null : rider.id)}
                          className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition duration-200 ${
                            isCurrentlyAssigned
                              ? "border-[#22C55E] bg-[#22C55E]/5"
                              : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                          }`}
                        >
                          <div>
                            <div className="text-xs font-semibold text-white">{rider.name}</div>
                            <div className="text-[10px] text-muted mt-0.5 font-mono">{rider.vehicleType.toUpperCase()} • Speed {rider.speedKmph}km/h</div>
                          </div>
                          {isCurrentlyAssigned ? (
                            <span className="text-[10px] font-bold text-emerald-400">ASSIGNED</span>
                          ) : (
                            <span className="text-[10px] font-bold text-[#2563EB] hover:underline">MATCH</span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
                <HelpCircle className="mx-auto text-muted mb-2" size={24} />
                <p className="text-xs text-muted">Select an active order from the intake queue to evaluate matching riders.</p>
              </div>
            )}
          </article>

          {/* Incidents Interventions */}
          <article className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              SLA Risk Interventions
            </h2>
            <p className="text-[11px] text-muted leading-relaxed">
              {"If an active delivery's SLA timer is breached, the console will raise a critical alert. Dispatchers can manually release riders from lower-priority orders to secure critical dropoffs."}
            </p>
          </article>
        </aside>
      </section>
    </div>
  );
}
