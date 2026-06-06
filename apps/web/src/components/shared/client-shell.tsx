"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { useWebSocketSync } from "@/hooks/useWebSocketSync";

interface ClientShellProps {
  children: ReactNode;
}

export function ClientShell({ children }: ClientShellProps) {
  const pathname = usePathname();
  
  // Activate global WebSocket synchronization for real-time telemetry updates
  useWebSocketSync();

  // If the dispatcher is looking at the mobile rider workspace, isolate it entirely
  const isRiderWorkspace = pathname.startsWith("/rider");

  if (isRiderWorkspace) {
    return (
      <main className="min-h-screen bg-[#05080d] p-0 text-white">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#05080d] p-4 text-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 md:px-6 xl:px-8">
        {children}
      </main>
    </div>
  );
}
