"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bot,
  Box,
  ChevronDown,
  Command,
  Gauge,
  Grid2X2,
  MapPin,
  Route,
  Settings,
  Users,
  Database
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "/overview", icon: Grid2X2 },
  { label: "Live Operations", href: "/live-operations", icon: MapPin },
  { label: "Dispatch Center", href: "/dispatch", icon: Command },
  { label: "Order Ingestion", href: "/orders", icon: Box },
  { label: "Optimization", href: "/optimization", icon: Route },
  { label: "AI Ops Center", href: "/ai-ops", icon: Bot },
  { label: "Analytics", href: "/analytics", icon: Gauge },
  { label: "Data Sources Management", href: "/data-sources", icon: Database },
  { label: "Rider App", href: "/rider", icon: Users, badge: "Mobile" },
  { label: "Settings", href: "/settings", icon: Settings }
];

function ROVIKLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-11 w-11 flex-shrink-0">
        <div className="absolute inset-0 rounded-[12px] bg-gradient-to-br from-white via-[#2563EB] to-[#22C55E] opacity-95" />
        <div className="absolute inset-[4px] rounded-[9px] bg-[#0A0E14]" />
        <div className="absolute left-[10px] top-[13px] h-[6px] w-[22px] rounded-full bg-white" />
        <div className="absolute left-[10px] top-[20px] h-[6px] w-[16px] origin-left rotate-45 rounded-full bg-[#2563EB]" />
      </div>
      <div>
        <div className="text-xl font-semibold tracking-wide text-white">ROVIK</div>
        <div className="text-[10px] tracking-normal text-muted">LOGISTICS INFRASTRUCTURE</div>
      </div>
    </div>
  );
}

import { useSettingsStore, LanguageKey } from "@/stores/useSettingsStore";

export function Sidebar() {
  const pathname = usePathname();
  const settings = useSettingsStore();

  return (
    <aside className="glass-panel hidden h-[calc(100vh-2rem)] w-[240px] flex-shrink-0 flex-col rounded-2xl p-5 xl:flex">
      <ROVIKLogo />
      
      <nav className="mt-8 flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          const i18nKeyMap: Record<string, string> = {
            "Overview": "overview",
            "Live Operations": "live_ops",
            "Dispatch Center": "dispatch",
            "Optimization": "optimization",
            "AI Ops Center": "ai_ops",
            "Analytics": "analytics",
            "Rider App": "rider_app",
            "Settings": "settings"
          };
          const translatedLabel = i18nKeyMap[item.label] ? settings.t(i18nKeyMap[item.label]) : item.label;
          
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-medium transition duration-200 ${
                isActive
                  ? "bg-[#2563EB] text-white shadow-glow"
                  : "text-white/70 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon size={17} className={isActive ? "text-white" : "text-white/60"} />
                {translatedLabel}
              </span>
              {item.badge && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold text-white/80">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 pt-4 space-y-3">
        {/* Language Selection HUD */}
        <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-lg px-3 py-1.5">
          <span className="text-[10px] text-muted font-bold tracking-wider uppercase">{settings.t("language")}</span>
          <select
            value={settings.selectedLanguage}
            onChange={(e) => settings.setLanguage(e.target.value as LanguageKey)}
            className="rounded border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-bold text-white focus:outline-none focus:border-[#2563EB]"
          >
            <option value="en" className="bg-[#0A0E14]">EN (English)</option>
            <option value="es" className="bg-[#0A0E14]">ES (Español)</option>
            <option value="de" className="bg-[#0A0E14]">DE (Deutsch)</option>
            <option value="ta" className="bg-[#0A0E14]">TA (தமிழ்)</option>
            <option value="hi" className="bg-[#0A0E14]">HI (हिन्दी)</option>
            <option value="te" className="bg-[#0A0E14]">TE (తెలుగు)</option>
            <option value="mr" className="bg-[#0A0E14]">MR (मराठी)</option>
            <option value="bn" className="bg-[#0A0E14]">BN (বাংলা)</option>
          </select>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-white/[0.03] p-3">
          <div className="h-9 w-9 flex-shrink-0 rounded-full bg-gradient-to-br from-[#2563EB] to-[#22C55E]" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-white">Arjun Mehta</div>
            <div className="text-[10px] text-muted font-mono">Super Admin</div>
          </div>
          <ChevronDown size={14} className="text-muted flex-shrink-0" />
        </div>
      </div>
    </aside>
  );
}

