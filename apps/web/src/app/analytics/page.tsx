"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Fuel,
  TrendingUp,
  Users,
  AlertTriangle
} from "lucide-react";

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem("auth_token") || "local-dev";
        const res = await fetch("http://localhost:8000/api/v1/analytics/metrics", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (e) {
        console.error("Failed to fetch metrics", e);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  // Mock data for analytics trends if live data is not available yet
  const performanceKPIs = metrics ? [
    { label: "On-Time Compliance", value: `${metrics.sla_accuracy_percent}%`, delta: "live", desc: "based on SLA breaches" },
    { label: "Completed Deliveries", value: `${metrics.completed_deliveries}`, delta: "live", desc: `out of ${metrics.total_volume} total` },
    { label: "Total Revenue", value: `$${metrics.total_revenue_usd}`, delta: "live", desc: "estimated" },
    { label: "Active Utilization", value: `${metrics.active_fleet_utilization}%`, delta: "live", desc: "rider workload cap" }
  ] : [
    { label: "On-Time Compliance", value: "94.2%", delta: "+1.8%", desc: "vs past 7 days" },
    { label: "Avg Delivery Time", value: "22.4m", delta: "-2.1m", desc: "improved latency" },
    { label: "Cost Per Dispatch", value: "₹45.2", delta: "-₹4.8", desc: "savings from solver" },
    { label: "Active Utilization", value: "88.6%", delta: "+4.2%", desc: "rider workload cap" }
  ];

  const riderPerformance = [
    { name: "Rider 12", speed: "22.4 km/h", orders: 32, compliance: "98%", status: "High" },
    { name: "Rider 07", speed: "26.8 km/h", orders: 28, compliance: "96%", status: "High" },
    { name: "Rider 03", speed: "24.5 km/h", orders: 26, compliance: "94%", status: "High" },
    { name: "Rider 09", speed: "19.8 km/h", orders: 20, compliance: "90%", status: "Med" }
  ];

  return (
    <div className="space-y-6 py-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Operational Analytics</h1>
          <p className="text-sm text-muted">Business intelligence, rider utilization trends, and historical SLA compliance</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80">
          <Calendar size={14} className="text-[#2563EB]" />
          Last 30 Days
        </div>
      </header>

      {/* KPI Matrix */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {performanceKPIs.map((kpi) => (
          <article key={kpi.label} className="glass-panel rounded-xl p-4 space-y-2">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">{kpi.label}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{kpi.value}</span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center">
                <ArrowUpRight size={12} />
                {kpi.delta}
              </span>
            </div>
            <p className="text-[10px] text-muted">{kpi.desc}</p>
          </article>
        ))}
      </section>

      {/* Charting Section */}
      <section className="grid gap-6 md:grid-cols-2">
        {/* Compliance Trend (Custom SVG Chart) */}
        <article className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Activity size={14} className="text-[#2563EB]" />
              SLA On-Time Compliance Rate
            </h2>
            <span className="text-[10px] text-emerald-400">Target: 95%</span>
          </div>

          <div className="relative h-48 w-full flex items-end">
            {/* Custom SVG Line Grid */}
            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
              {/* Horizontal Gridlines */}
              <line x1="0" y1="20%" x2="100%" y2="20%" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="80%" x2="100%" y2="80%" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              {/* Smooth Spline Vector */}
              <path
                d="M 0 100 C 40 70, 80 80, 120 40 C 160 10, 200 30, 240 20 C 280 10, 320 45, 360 30 C 400 15, 440 25, 480 15"
                fill="none"
                stroke="#2563EB"
                strokeWidth="3.5"
                className="path-draw"
                style={{ strokeDasharray: 1000, strokeDashoffset: 0 }}
              />
            </svg>
            <div className="absolute inset-x-0 bottom-0 flex justify-between text-[9px] text-muted font-mono px-1">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
            </div>
          </div>
        </article>

        {/* Dispatch Volume Bars (Custom CSS Bars Chart) */}
        <article className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <BarChart3 size={14} className="text-[#22C55E]" />
              Hourly Order Intake Waves
            </h2>
            <span className="text-[10px] text-muted">Daily Wave</span>
          </div>

          <div className="flex h-48 w-full items-end justify-between gap-3 px-2 pt-4">
            {[45, 62, 85, 120, 95, 75, 110, 130, 90, 60, 40].map((val, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  style={{ height: `${(val / 140) * 100}%` }}
                  className="w-full rounded-t-md bg-gradient-to-t from-[#2563EB]/40 to-[#2563EB] hover:to-[#22C55E] transition-all duration-300"
                />
                <span className="text-[8px] text-muted font-mono">{8 + index}h</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Rider Performance Table */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <article className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Users size={16} className="text-[#2563EB]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Rider Efficiency Benchmark</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-muted">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-muted tracking-wider">
                  <th className="py-3">Rider Name</th>
                  <th className="py-3">Avg Speed</th>
                  <th className="py-3">Completed Drops</th>
                  <th className="py-3">SLA Compliance</th>
                  <th className="py-3 text-right">Rating</th>
                </tr>
              </thead>
              <tbody>
                {riderPerformance.map((rider) => (
                  <tr key={rider.name} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="py-3.5 font-semibold text-white">{rider.name}</td>
                    <td className="py-3.5">{rider.speed}</td>
                    <td className="py-3.5">{rider.orders}</td>
                    <td className="py-3.5 text-emerald-400 font-semibold">{rider.compliance}</td>
                    <td className="py-3.5 text-right font-bold text-[#2563EB]">{rider.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        {/* Fuel and Solver Cost Efficiency */}
        <aside className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Fuel size={16} className="text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Fuel & Solver Efficiency</h2>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-muted leading-relaxed">
              {"ROVIK's OR-Tools adaptive routing module minimizes empty rider segments (re-positioning costs)."}
            </p>
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 space-y-3">
              <div className="flex justify-between text-xs text-white">
                <span>Distance Saved:</span>
                <span className="font-semibold text-emerald-400">-324.5 km</span>
              </div>
              <div className="flex justify-between text-xs text-white">
                <span>Fuel Cost Reduced:</span>
                <span className="font-semibold text-emerald-400">${metrics ? metrics.fuel_savings_usd : "12.45"}</span>
              </div>
              <div className="flex justify-between text-xs text-white">
                <span>Carbon Reduction:</span>
                <span className="font-semibold text-emerald-400">-{metrics ? ((metrics.fuel_savings_usd / 3) * 2.31).toFixed(1) : "84.2"} kg CO₂</span>
              </div>
            </div>

            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 flex gap-2.5">
              <AlertTriangle className="text-amber-500 flex-shrink-0" size={16} />
              <p className="text-[10px] text-amber-200/80 leading-relaxed">
                Aggressive congestion waves expected between 17:00 and 19:30 on Mylapore grids. Routing coefficients have been adjusted by 1.15.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
