"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Edit2, Trash2 } from "lucide-react";
import { useDispatchStore } from "@/stores/useDispatchStore";

interface ImportJob {
  id: string;
  status: string;
  file_name: string;
  total_rows: number;
  success_rows: number;
  failed_rows: number;
  import_type: string;
}

interface ImportRow {
  id: string;
  row_index: number;
  parsed_data: any;
  is_valid: boolean;
  validation_errors: string[];
}

export default function ValidationCenterPage() {
  const [jobId, setJobId] = useState<string>("");
  const [job, setJob] = useState<ImportJob | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { setDeliveries } = useDispatchStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jId = params.get("jobId");
    if (jId) {
      setJobId(jId);
      fetchJobPreview(jId);
    }
  }, []);

  // In a real app, you'd list all pending_approval jobs on the left sidebar.
  // For this MVP, we let the user paste the job ID or it could be passed via URL.
  const fetchJobPreview = async (id: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth_token") || "local-dev";
      const res = await fetch(`http://localhost:8000/api/v1/orders/import-jobs/${id}/preview`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setJob(data.job);
        setRows(data.rows);
      } else {
        alert("Job not found");
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleCommit = async () => {
    if (!job) return;
    try {
      const token = localStorage.getItem("auth_token") || "local-dev";
      const res = await fetch(`http://localhost:8000/api/v1/orders/import-jobs/${job.id}/commit`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        // Push valid rows to dispatch store
        const validDeliveries = rows.filter(r => r.is_valid && (r.parsed_data.delivery_latitude || r.parsed_data.delivery_lat)).map((r, i) => ({
          id: `IMP-${i + 1}`,
          externalId: r.id,
          priority: 3,
          status: "pending" as const,
          latitude: r.parsed_data.delivery_latitude || r.parsed_data.delivery_lat,
          longitude: r.parsed_data.delivery_longitude || r.parsed_data.delivery_lng,
          slaMinutes: 60,
          assignedRiderId: null,
          area: r.parsed_data.delivery_address || "Imported Area",
          createdAt: new Date().toISOString()
        }));
        setDeliveries(validDeliveries);
        
        alert(`Successfully imported ${data.imported_count} orders!`);
        setJob(null);
        setRows([]);
      } else {
        alert("Commit failed: " + data.detail);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Validation Center</h1>
        <p className="text-gray-500 mt-2">Review extracted data, correct errors, and approve orders for dispatch.</p>
      </div>

      {!job && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enter Import Job ID</label>
            <input 
              type="text" 
              className="w-full rounded-md border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white px-4 py-2"
              placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
            />
          </div>
          <button 
            onClick={() => fetchJobPreview(jobId)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load Preview"}
          </button>
        </div>
      )}

      {job && (
        <>
          {/* Job Summary Banner */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">File: {job.file_name}</h2>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-gray-500">Total: <b className="text-gray-900 dark:text-white">{job.total_rows}</b></span>
                <span className="text-green-600">Valid: <b>{job.success_rows}</b></span>
                <span className="text-red-600">Errors: <b>{job.failed_rows}</b></span>
              </div>
            </div>
            <button 
              onClick={handleCommit}
              disabled={job.status !== "pending_approval"}
              className={`px-6 py-2 rounded-lg font-medium text-white ${job.status === "pending_approval" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-400 cursor-not-allowed"}`}
            >
              Approve & Import Valid Rows
            </button>
          </div>

          {/* Data Table */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                <thead className="bg-gray-50 dark:bg-zinc-950/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coordinates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Errors</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-800">
                  {rows.map((row) => (
                    <tr key={row.id} className={row.is_valid ? "" : "bg-red-50 dark:bg-red-900/10"}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {row.is_valid ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {row.parsed_data.customer_name || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                        {row.parsed_data.delivery_address || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.parsed_data.delivery_latitude || row.parsed_data.delivery_lat ? `${(row.parsed_data.delivery_latitude || row.parsed_data.delivery_lat).toFixed(4)}, ${(row.parsed_data.delivery_longitude || row.parsed_data.delivery_lng).toFixed(4)}` : "Not geocoded"}
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600 font-medium max-w-xs">
                        {row.validation_errors?.join(", ")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
