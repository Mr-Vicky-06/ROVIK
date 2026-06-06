"use client";

import { useState, useEffect } from "react";
import { divIcon, LatLngExpression } from "leaflet";
import { Fragment } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { X, Box, PlusCircle } from "lucide-react";

import type { RoutePreview } from "@/lib/sample-data";
import { useSettingsStore, cityProfiles } from "@/stores/useSettingsStore";
import { useDispatchStore } from "@/stores/useDispatchStore";
import { useFleetStore } from "@/stores/useFleetStore";

type DispatchMapProps = {
  routes: RoutePreview[];
};

// Helper component to dynamically re-center map when active city swaps
function ChangeMapView({ center }: { center: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Map Click Listener to capture double-clicks
function MapClickEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    dblclick(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export function DispatchMap({ routes }: DispatchMapProps) {
  const settings = useSettingsStore();
  const { addDelivery } = useDispatchStore();
  const riders = useFleetStore((state) => state.riders);
  
  const activeCity = cityProfiles[settings.selectedCity];
  const center: LatLngExpression = [activeCity.latitude, activeCity.longitude];
  
  // Custom Order Intake Modal State
  const [clickCoords, setClickCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [priority, setPriority] = useState<number>(3);
  const [sla, setSla] = useState<number>(45);

  const transparentTile =
    "data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";
    
  const depotIcon = divIcon({
    className: "",
    html: `<div style="position:relative;width:54px;height:54px;display:grid;place-items:center;">
      <span style="position:absolute;width:54px;height:54px;border-radius:999px;background:rgba(37,99,235,.18);border:1px solid rgba(34,200,232,.28);" class="pulse-ring"></span>
      <span style="width:30px;height:30px;border-radius:999px;background:#2563eb;border:1px solid rgba(255,255,255,.45);box-shadow:0 0 28px rgba(37,99,235,.8);display:grid;place-items:center;color:white;font-size:13px;font-weight:800;">R</span>
    </div>`,
    iconSize: [54, 54],
    iconAnchor: [27, 27]
  });

  const handleCreateCustomOrder = () => {
    if (!clickCoords) return;
    const orderId = `ORD-${1034 + Math.floor(Math.random() * 1000)}`;
    addDelivery({
      id: orderId,
      externalId: orderId,
      priority,
      status: "pending",
      latitude: clickCoords.lat,
      longitude: clickCoords.lng,
      slaMinutes: sla,
      assignedRiderId: null,
      area: activeCity.name.split(",")[0],
      createdAt: new Date().toISOString()
    });
    setClickCoords(null);
  };

  return (
    <div className="rovik-grid relative h-[560px] overflow-hidden bg-[#06101a]">
      <div className="pointer-events-none absolute inset-0 z-[420] bg-[radial-gradient(circle_at_50%_48%,transparent_0,rgba(5,8,13,.08)_34%,rgba(5,8,13,.72)_100%)]" />
      <div className="pointer-events-none absolute left-5 top-5 z-[430] rounded-full border border-white/10 bg-black/[0.35] px-3 py-2 text-xs font-medium text-white/80 backdrop-blur-xl">
        {settings.t("active_mesh")}: {activeCity.name}
      </div>

      {/* Map Click Instruction Banner */}
      <div className="pointer-events-none absolute left-5 bottom-5 z-[430] rounded-lg border border-white/5 bg-black/[0.6] px-3 py-2 text-[10px] text-muted backdrop-blur-md">
        💡 Double-click anywhere on map to ingest custom order coordinates.
      </div>

      <MapContainer center={center} zoom={12} scrollWheelZoom doubleClickZoom={false} className="z-0">
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          errorTileUrl={transparentTile}
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <ChangeMapView center={center} />
        <MapClickEvents onMapClick={(lat, lng) => setClickCoords({ lat, lng })} />

        <Marker position={center} icon={depotIcon}>
          <Popup>ROVIK Depot: {activeCity.name}</Popup>
        </Marker>

        {Object.values(riders).map((rider) => {
          if (!rider.latitude || !rider.longitude) return null;
          const liveIcon = divIcon({
            className: "",
            html: `<div style="position:relative;width:24px;height:24px;display:grid;place-items:center;">
              <span style="position:absolute;width:24px;height:24px;border-radius:999px;background:rgba(234,179,8,.2);border:1px solid rgba(234,179,8,.4);" class="pulse-ring"></span>
              <span style="width:12px;height:12px;border-radius:999px;background:#eab308;box-shadow:0 0 12px rgba(234,179,8,.8);"></span>
            </div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          return (
            <Marker key={rider.id} position={[rider.latitude, rider.longitude]} icon={liveIcon}>
              <Popup>
                <strong>{rider.id}</strong><br />
                Speed: {rider.speedKmph?.toFixed(1) || 0} km/h<br />
                Status: {rider.status}
              </Popup>
            </Marker>
          );
        })}

        {routes.map((route) => {
          const positions = route.stops.map((stop) => [stop.lat, stop.lng] as LatLngExpression);
          const riderIcon = divIcon({
            className: "",
            html: `<div style="width:28px;height:28px;border-radius:999px;background:${route.color};border:1px solid rgba(255,255,255,.72);box-shadow:0 0 22px ${route.color};display:grid;place-items:center;color:white;font-size:12px;font-weight:800;">${route.vehicleId.split("-").at(-1) ?? "R"}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });
          return (
            <Fragment key={route.vehicleId}>
              <Polyline
                positions={[center, ...positions]}
                pathOptions={{ color: route.color, weight: 4, opacity: 0.88 }}
              />
              {route.stops.map((stop, index) => (
                <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={riderIcon}>
                  <Popup>
                    <strong>{stop.id}</strong>
                    <br />
                    {route.vehicleId} ETA {stop.etaMinutes}m
                    <br />
                    Stop {index + 1}
                  </Popup>
                </Marker>
              ))}
            </Fragment>
          );
        })}
      </MapContainer>

      {/* Add Custom Map Order Modal Overlay */}
      {clickCoords && (
        <div className="absolute inset-0 bg-black/60 z-[500] backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0A0E14] p-5 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setClickCoords(null)}
              className="absolute right-4 top-4 text-muted hover:text-white"
              type="button"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <PlusCircle size={16} className="text-[#2563EB]" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Ingest Custom GIS Order</h3>
            </div>

            <div className="text-xs space-y-4 text-muted">
              <div>Captured Lat: <span className="text-white font-mono">{clickCoords.lat.toFixed(6)}</span></div>
              <div>Captured Lng: <span className="text-white font-mono">{clickCoords.lng.toFixed(6)}</span></div>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted">Priority Level (1-5)</label>
                <div className="flex justify-between gap-1.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setPriority(lvl)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-semibold border transition ${
                        priority === lvl
                          ? "border-[#2563EB] bg-[#2563EB]/10 text-white"
                          : "border-white/5 bg-white/[0.02] text-muted hover:bg-white/[0.05]"
                      }`}
                    >
                      P{lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold text-muted">
                  <span>SLA Duration Limit</span>
                  <span className="text-white font-mono">{sla} mins</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={sla}
                  onChange={(e) => setSla(Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                />
              </div>
            </div>

            <button
              onClick={handleCreateCustomOrder}
              className="w-full rounded-xl bg-[#2563EB] border border-[#2563EB]/20 py-2.5 text-xs font-bold text-white hover:bg-[#2563EB]/95 transition flex items-center justify-center gap-2"
              type="button"
            >
              <Box size={14} />
              Submit Custom Delivery
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
