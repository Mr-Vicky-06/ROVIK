"use client";

import { useState } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWebSocketSync } from "@/hooks/useWebSocketSync"; // Custom hook for WS

export default function SmartImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isBulkImportDone, setIsBulkImportDone] = useState(false);
  
  // Connect to our telemetry WebSocket for real-time import progress
  const { connected, latestMessage } = useWebSocketSync();
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };
  
  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const token = localStorage.getItem("auth_token") || "local-dev";
      let endpoint = "http://localhost:8000/api/v1/orders/smart-import";
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['csv', 'xlsx', 'json'].includes(ext || '')) {
        endpoint = "http://localhost:8000/api/v1/orders/import";
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });
      
      const data = await res.json();
      if (res.ok) {
        setJobId(data.job_id);
        if (data.status === "success") {
          setIsBulkImportDone(true);
        }
      } else {
        alert(data.detail);
        setIsUploading(false);
      }
    } catch (err) {
      console.error(err);
      setIsUploading(false);
    }
  };

  // Determine current pipeline step from websocket message
  const progressMessage = latestMessage?.type === "IMPORT_PROGRESS" && latestMessage.job_id === jobId 
    ? latestMessage 
    : null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Import</h1>
        <p className="text-gray-500 mt-2">Upload courier manifests, Excel sheets, or images. Our system will extract and structure the orders automatically.</p>
      </div>

      {!isUploading ? (
        <div 
          className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-12 text-center hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors bg-white dark:bg-zinc-900 shadow-sm cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input 
            id="file-upload" 
            type="file" 
            className="hidden" 
            accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.json" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {file ? file.name : "Click or drag file to upload"}
          </h3>
          <p className="text-sm text-gray-500 mt-2">Supports PDF, PNG, JPG, CSV, XLSX, JSON (Max 10MB)</p>
          
          {file && (
            <button 
              onClick={(e) => { e.stopPropagation(); handleUpload(); }}
              className="mt-6 px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Start Import Extraction
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{file?.name}</h3>
              <p className="text-sm text-gray-500">Processing via AI Pipeline...</p>
            </div>
            {progressMessage?.status === "pending_approval" || isBulkImportDone ? (
              <a href={`/orders/validation-center?jobId=${jobId}`} className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
                Go to Validation Center
              </a>
            ) : null}
          </div>
          
          {isBulkImportDone ? (
            <div className="text-center py-12">
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Structured Import Complete</h2>
              <p className="text-gray-500 mt-2">Your data has been processed synchronously.</p>
              <a href={`/orders/validation-center?jobId=${jobId}`} className="mt-6 inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
                Review in Validation Center
              </a>
            </div>
          ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-zinc-700 before:to-transparent">
            
            {/* Steps */}
            {[
              { id: "extracting_text", label: "OCR Text Extraction", desc: "Reading raw text from document" },
              { id: "structuring_data", label: "AI Structuring", desc: "LLM identifying delivery entities" },
              { id: "validating", label: "Geocoding & Validation", desc: "Converting addresses to coordinates" },
              { id: "pending_approval", label: "Awaiting Approval", desc: "Ready for review in Validation Center" },
            ].map((step, index) => {
              const isCurrent = progressMessage?.status === step.id;
              const isPast = progressMessage && ["extracting_text", "structuring_data", "validating", "pending_approval"].indexOf(progressMessage.status) > index;
              const isError = progressMessage?.status === "failed" && isCurrent;

              return (
                <div key={step.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2
                    ${isPast ? 'bg-green-500 border-green-200 dark:border-green-900' : 
                      isCurrent ? 'bg-indigo-500 border-indigo-200 dark:border-indigo-900' : 
                      isError ? 'bg-red-500 border-red-200' : 'bg-gray-300 border-white dark:bg-zinc-700 dark:border-zinc-900'}
                  `}>
                    {isPast ? <CheckCircle2 className="w-5 h-5 text-white" /> : 
                     isCurrent ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : 
                     isError ? <AlertCircle className="w-5 h-5 text-white" /> : 
                     <span className="text-white font-semibold text-xs">{index + 1}</span>}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow">
                    <div className="font-semibold text-gray-900 dark:text-white">{step.label}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {isCurrent && progressMessage ? progressMessage.message : step.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}
    </div>
  );
}
