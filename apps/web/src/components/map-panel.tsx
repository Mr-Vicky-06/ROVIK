"use client";

import dynamic from "next/dynamic";

import type { RoutePreview } from "@/lib/sample-data";

const DispatchMap = dynamic(
  () => import("@/components/dispatch-map").then((module) => module.DispatchMap),
  {
    ssr: false,
    loading: () => <div className="flex h-[520px] items-center justify-center text-sm">Loading map</div>
  }
);

type MapPanelProps = {
  routes: RoutePreview[];
};

export function MapPanel({ routes }: MapPanelProps) {
  return <DispatchMap routes={routes} />;
}
