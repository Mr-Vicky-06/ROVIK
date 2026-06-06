"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon path issues in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface GeoPoint {
  latitude: number;
  longitude: number;
}

interface RouteStop {
  location: GeoPoint;
}

interface VehicleRoute {
  vehicle_id: string;
  stops: RouteStop[];
}

interface Props {
  routes: VehicleRoute[];
  isAnimating: boolean;
}

// A CSS-based 3D isometric box representing our truck for tonight's iteration
const getTruckIcon = (heading: number) => {
  return L.divIcon({
    className: "transparent-icon",
    html: `
      <div style="
        width: 24px;
        height: 24px;
        position: relative;
        transform: rotate(${heading}deg);
        transition: transform 0.1s linear;
      ">
        <div style="
          position: absolute;
          width: 16px;
          height: 24px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 3px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5);
          left: 4px;
          border: 1px solid #1e3a8a;
        ">
          <!-- Windshield -->
          <div style="
            position: absolute;
            top: 4px;
            left: 2px;
            right: 2px;
            height: 6px;
            background: #93c5fd;
            border-radius: 1px;
          "></div>
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const defaultCenter: [number, number] = [13.0827, 80.2707]; // Chennai

function AnimationController({ routes, isAnimating }: { routes: VehicleRoute[], isAnimating: boolean }) {
  const map = useMap();
  const [vehiclePositions, setVehiclePositions] = useState<Record<string, { lat: number, lng: number, heading: number }>>({});
  
  useEffect(() => {
    if (!routes || routes.length === 0) return;
    
    // Auto-fit bounds
    const bounds = L.latLngBounds([]);
    routes.forEach(route => {
      route.stops.forEach(stop => {
        bounds.extend([stop.location.latitude, stop.location.longitude]);
      });
    });
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Init positions at start of routes
    const initialPositions: Record<string, any> = {};
    routes.forEach(r => {
      if (r.stops.length > 0) {
        initialPositions[r.vehicle_id] = { 
          lat: r.stops[0].location.latitude, 
          lng: r.stops[0].location.longitude,
          heading: 0
        };
      }
    });
    setVehiclePositions(initialPositions);

  }, [routes, map]);

  useEffect(() => {
    if (!isAnimating || routes.length === 0) return;

    let animationFrameId: number;
    let progress = 0; // 0 to 1
    const ANIMATION_SPEED = 0.002; // Adjust for speed

    const calculatePosition = (stops: RouteStop[], prog: number) => {
      if (stops.length === 1) return { lat: stops[0].location.latitude, lng: stops[0].location.longitude, heading: 0 };
      
      const totalSegments = stops.length - 1;
      const scaledProgress = prog * totalSegments;
      const segmentIndex = Math.floor(scaledProgress);
      
      if (segmentIndex >= totalSegments) {
        const last = stops[stops.length - 1].location;
        return { lat: last.latitude, lng: last.longitude, heading: 0 };
      }

      const segmentProgress = scaledProgress - segmentIndex;
      const start = stops[segmentIndex].location;
      const end = stops[segmentIndex + 1].location;

      const lat = start.latitude + (end.latitude - start.latitude) * segmentProgress;
      const lng = start.longitude + (end.longitude - start.longitude) * segmentProgress;

      // Calculate heading
      const dy = end.latitude - start.latitude;
      const dx = Math.cos(Math.PI / 180 * start.latitude) * (end.longitude - start.longitude);
      let heading = Math.atan2(dy, dx) * 180 / Math.PI;
      heading = 90 - heading; // Adjust to map orientation

      return { lat, lng, heading };
    };

    const animate = () => {
      progress += ANIMATION_SPEED;
      if (progress > 1) {
        progress = 1; // Stop at end
      }

      setVehiclePositions(prev => {
        const newPositions = { ...prev };
        routes.forEach(route => {
          if (route.stops.length > 0) {
            newPositions[route.vehicle_id] = calculatePosition(route.stops, progress);
          }
        });
        return newPositions;
      });

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isAnimating, routes]);

  return (
    <>
      {routes.map(route => {
        const pos = vehiclePositions[route.vehicle_id];
        if (!pos) return null;
        return (
          <Marker 
            key={route.vehicle_id}
            position={[pos.lat, pos.lng]}
            icon={getTruckIcon(pos.heading)}
            zIndexOffset={1000}
          />
        );
      })}
    </>
  );
}

export function AnimatedDispatchMap({ routes, isAnimating }: Props) {
  return (
    <div className="h-full w-full relative bg-[#1E293B] rounded-xl overflow-hidden shadow-inner border border-white/10">
      <MapContainer 
        center={defaultCenter} 
        zoom={12} 
        scrollWheelZoom={true} 
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Draw Polylines */}
        {routes.map((route, i) => {
          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
          const color = colors[i % colors.length];
          const positions = route.stops.map(s => [s.location.latitude, s.location.longitude] as [number, number]);
          
          return (
            <div key={`route-${route.vehicle_id}`}>
              <Polyline 
                positions={positions} 
                pathOptions={{ color, weight: 3, opacity: 0.7, dashArray: "5, 5" }} 
              />
              {/* Draw dots at each stop */}
              {positions.map((pos, idx) => (
                <Marker 
                  key={`${route.vehicle_id}-stop-${idx}`}
                  position={pos}
                  icon={L.divIcon({
                    className: 'transparent',
                    html: `<div style="width:8px;height:8px;background:${color};border-radius:50%;border:2px solid #1e293b;"></div>`,
                    iconSize: [8, 8],
                    iconAnchor: [4, 4]
                  })}
                />
              ))}
            </div>
          );
        })}

        <AnimationController routes={routes} isAnimating={isAnimating} />
      </MapContainer>
    </div>
  );
}
