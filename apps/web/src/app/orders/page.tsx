"use client";

import Link from "next/link";
import { PlusCircle, UploadCloud, List, History } from "lucide-react";

export default function OrderIngestionCenter() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order Ingestion Center</h1>
        <p className="text-gray-500 mt-2 text-lg">Manage all inbound demand, manual entries, and file imports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create Order */}
        <Link href="/orders/create" className="group flex flex-col items-start p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm hover:border-indigo-500 hover:shadow-md transition-all">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl mb-6 group-hover:scale-110 transition-transform">
            <PlusCircle className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Manual Order</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Enter single delivery orders manually with full parameter control.</p>
        </Link>

        {/* File Import */}
        <Link href="/orders/smart-import" className="group flex flex-col items-start p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm hover:border-blue-500 hover:shadow-md transition-all">
          <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl mb-6 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">File Import</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Upload CSV, XLSX, JSON, or PDF manifests for AI extraction.</p>
        </Link>

        {/* Order History */}
        <Link href="/orders/history" className="group flex flex-col items-start p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl mb-6 group-hover:scale-110 transition-transform">
            <History className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ingestion History</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">View previously imported jobs and manual entry logs.</p>
        </Link>
      </div>
    </div>
  );
}
