"use client";

import { useState } from "react";
import { 
  Database, UploadCloud, Activity, ShieldCheck, Download, 
  CheckCircle2, AlertTriangle, XCircle, RefreshCw, Server, 
  FileJson, FileSpreadsheet, FileText, DatabaseZap
} from "lucide-react";

export default function DataSourcesPage() {
  const [activeTab, setActiveTab] = useState("registry");

  const tabs = [
    { id: "registry", label: "Source Registry", icon: Database },
    { id: "upload", label: "Upload Center", icon: UploadCloud },
    { id: "etl", label: "ETL Control Center", icon: Activity },
    { id: "quality", label: "Data Quality", icon: ShieldCheck },
    { id: "dataset", label: "Dataset Builder", icon: Download }
  ];

  return (
    <div className="space-y-6 py-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <DatabaseZap className="text-emerald-500" />
            Data Sources Management
          </h1>
          <p className="text-sm text-muted">
            Enterprise Data Acquisition, ETL Pipelines, and Governance Control Center
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-white/10 pb-px">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                isActive 
                  ? "border-[#2563EB] text-white bg-white/[0.03]" 
                  : "border-transparent text-muted hover:text-white hover:bg-white/[0.02]"
              }`}
            >
              <Icon size={16} className={isActive ? "text-[#2563EB]" : ""} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {activeTab === "registry" && <SourceRegistryPanel />}
        {activeTab === "upload" && <UploadCenterPanel />}
        {activeTab === "etl" && <ETLControlCenterPanel />}
        {activeTab === "quality" && <DataQualityPanel />}
        {activeTab === "dataset" && <DatasetBuilderPanel />}
      </div>
    </div>
  );
}

// Subcomponents

function SourceRegistryPanel() {
  const sources = [
    { name: "Order Ingestion (REST)", type: "API", status: "active", latency: "45ms" },
    { name: "Rider Telemetry WebSocket", type: "Stream", status: "active", latency: "12ms" },
    { name: "Mapbox Traffic API", type: "External", status: "warning", latency: "450ms" },
    { name: "OpenWeatherMap API", type: "External", status: "active", latency: "120ms" },
    { name: "Legacy ERP Nightly Export", type: "Batch (CSV)", status: "failed", latency: "Timeout" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <div className="text-xs font-semibold text-muted uppercase">Active Integrations</div>
          <div className="mt-2 text-2xl font-bold text-white">12</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <div className="text-xs font-semibold text-muted uppercase">Streaming Throughput</div>
          <div className="mt-2 text-2xl font-bold text-white">450 <span className="text-sm font-normal text-muted">events/s</span></div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-white/10">
          <div className="text-xs font-semibold text-muted uppercase">Storage Utilization</div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">22.4 GB <span className="text-sm font-normal text-muted">/ 50GB</span></div>
        </div>
      </div>

      <div className="glass-panel rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/5 font-semibold text-sm">Connected Sources</div>
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.02] text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Source Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Latency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sources.map(s => (
              <tr key={s.name} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white font-medium flex items-center gap-2">
                  <Server size={14} className="text-muted" />
                  {s.name}
                </td>
                <td className="px-4 py-3 text-muted">{s.type}</td>
                <td className="px-4 py-3">
                  {s.status === "active" && <span className="flex items-center gap-1 text-emerald-400 text-xs bg-emerald-400/10 px-2 py-1 rounded-full w-fit"><CheckCircle2 size={12}/> Active</span>}
                  {s.status === "warning" && <span className="flex items-center gap-1 text-amber-400 text-xs bg-amber-400/10 px-2 py-1 rounded-full w-fit"><AlertTriangle size={12}/> Degraded</span>}
                  {s.status === "failed" && <span className="flex items-center gap-1 text-rose-400 text-xs bg-rose-400/10 px-2 py-1 rounded-full w-fit"><XCircle size={12}/> Failed</span>}
                </td>
                <td className="px-4 py-3 text-muted">{s.latency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UploadCenterPanel() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center hover:border-[#2563EB] transition-colors cursor-pointer bg-white/[0.01]">
        <div className="flex justify-center mb-4">
          <div className="bg-[#2563EB]/20 p-4 rounded-full">
            <UploadCloud className="text-[#2563EB]" size={40} />
          </div>
        </div>
        <h3 className="text-lg font-bold text-white">Drag & Drop Files Here</h3>
        <p className="text-muted text-sm mt-2">Supports CSV, XLSX, JSON, and PDF Manifests</p>
        <p className="text-xs text-muted/60 mt-1">Automatic schema detection and deduplication is enabled.</p>
        
        <div className="flex justify-center gap-4 mt-6">
          <button className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition">
            Browse Files
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-xl border border-white/10 p-5">
        <h3 className="text-sm font-bold border-b border-white/5 pb-3 mb-4">Recent Uploads</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5">
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={20} className="text-emerald-500" />
              <div>
                <div className="text-sm font-medium text-white">daily_dispatch_plan.xlsx</div>
                <div className="text-xs text-muted">14.2 MB • 2 minutes ago</div>
              </div>
            </div>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-400/10 px-2 py-1 rounded">PROCESSED</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5">
            <div className="flex items-center gap-3">
              <FileJson size={20} className="text-amber-500" />
              <div>
                <div className="text-sm font-medium text-white">erp_export_v2.json</div>
                <div className="text-xs text-muted">2.1 MB • 1 hour ago</div>
              </div>
            </div>
            <span className="text-xs text-amber-400 font-bold bg-amber-400/10 px-2 py-1 rounded">SCHEMA MISMATCH</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ETLControlCenterPanel() {
  const jobs = [
    { id: "telemetry_ingestion_dag", status: "running", time: "00:14:22" },
    { id: "order_ingestion_dag", status: "success", time: "00:02:10" },
    { id: "feature_generation_dag", status: "running", time: "00:05:40" },
    { id: "gis_sync_dag", status: "failed", time: "00:00:45" },
    { id: "model_training_dag", status: "queued", time: "-" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/[0.02] border border-white/10 p-4 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-[#2563EB]/20 rounded-lg flex items-center justify-center border border-[#2563EB]/40">
            <Activity className="text-[#2563EB]" />
          </div>
          <div>
            <div className="text-sm font-bold">Apache Airflow Engine</div>
            <div className="text-xs text-emerald-400">Scheduler: Active • Workers: 4</div>
          </div>
        </div>
        <button className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
          <RefreshCw size={12} /> Sync DAGs
        </button>
      </div>

      <div className="glass-panel rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.02] text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Pipeline DAG</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {jobs.map(job => (
              <tr key={job.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white font-mono text-xs">{job.id}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${
                    job.status === 'running' ? 'bg-[#2563EB]/20 text-[#2563EB] border-[#2563EB]/30' :
                    job.status === 'success' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                    job.status === 'failed' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                    'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted text-xs font-mono">{job.time}</td>
                <td className="px-4 py-3 text-right">
                  <button className="text-[10px] uppercase font-semibold text-white/50 hover:text-white mr-2">Pause</button>
                  <button className="text-[10px] uppercase font-semibold text-[#2563EB] hover:text-[#3b82f6]">Trigger</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DataQualityPanel() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass-panel p-6 rounded-xl border border-white/10 flex flex-col justify-center items-center">
          <div className="relative h-40 w-40">
            <svg viewBox="0 0 36 36" className="w-full h-full stroke-emerald-500 fill-none stroke-[3] transform -rotate-90">
              <path strokeDasharray="98, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="stroke-white/10" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">98%</span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase mt-1">Purity Score</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">Validation Rules Triggered</h3>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted">Invalid GPS Coordinates</span>
                <span className="text-white font-mono">142 events</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-rose-500 w-[15%]"></div></div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted">Impossible Speeds {'>'} 120km/h</span>
                <span className="text-white font-mono">45 events</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-amber-500 w-[5%]"></div></div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted">Missing Mandatory Fields</span>
                <span className="text-white font-mono">12 records</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-amber-500 w-[2%]"></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DatasetBuilderPanel() {
  const datasets = [
    { name: "historical_orders.csv", rows: "1.2M", size: "450 MB" },
    { name: "historical_telemetry.csv", rows: "45M", size: "4.2 GB" },
    { name: "ml_training_dataset.csv", rows: "850K", size: "1.1 GB" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-3">
        <button className="px-4 py-2 bg-[#2563EB] hover:bg-[#3b82f6] text-white rounded-lg text-sm font-medium flex items-center gap-2">
          <FileText size={14} /> Generate Custom ML Dataset
        </button>
      </div>

      <div className="glass-panel rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.02] text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Dataset Identifier</th>
              <th className="px-4 py-3 font-medium">Row Count</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {datasets.map(ds => (
              <tr key={ds.name} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white font-medium flex items-center gap-2">
                  <Database size={14} className="text-emerald-500" />
                  {ds.name}
                </td>
                <td className="px-4 py-3 text-muted">{ds.rows}</td>
                <td className="px-4 py-3 text-muted">{ds.size}</td>
                <td className="px-4 py-3 text-right">
                  <button className="text-[10px] uppercase font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-white flex items-center gap-1 inline-flex">
                    <Download size={12} /> Export
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
