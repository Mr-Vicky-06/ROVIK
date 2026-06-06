"use client";

import { useEffect, useRef, useState } from "react";
import { useFleetStore } from "@/stores/useFleetStore";
import { useDispatchStore } from "@/stores/useDispatchStore";

export function useWebSocketSync(tenantId: string = "00000000-0000-0000-0000-000000000001") {
  const [connected, setConnected] = useState(false);
  const [latestMessage, setLatestMessage] = useState<any>(null);
  const updateRiderLocation = useFleetStore((state) => state.updateRiderLocation);
  const addDelivery = useDispatchStore((state) => state.addDelivery);
  const assignDelivery = useDispatchStore((state) => state.assignDelivery);
  const updateDeliveryStatus = useDispatchStore((state) => state.updateDeliveryStatus);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    function connect() {
      // Build dynamic WebSocket URL matching backend API port 8000
      const token = typeof window !== "undefined" ? localStorage.getItem("rovik_token") || "local-dev" : "local-dev";
      const wsUrl = `ws://localhost:8000/api/v1/ws/${tenantId}?token=${token}`;
      console.log(`[WebSocket] Connecting to ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log(`[WebSocket] Connected successfully to tenant: ${tenantId}`);
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { event_type, type, payload } = message;
          
          setLatestMessage(message);

          console.log(`[WebSocket] Live event received: ${event_type || type}`, payload || message);

          switch (event_type || type) {
            case "rider_location_updated":
              updateRiderLocation(
                payload.rider_id,
                payload.latitude,
                payload.longitude,
                payload.speed_kmph,
                payload.heading_degrees,
                payload.route_deviation_m
              );
              break;

            case "order_created":
              addDelivery({
                id: payload.order_id,
                externalId: payload.order_id,
                priority: payload.priority ?? 3,
                status: "pending",
                latitude: payload.dropoff?.latitude ?? 13.0827,
                longitude: payload.dropoff?.longitude ?? 80.2707,
                slaMinutes: payload.promised_eta_min ?? 45,
                assignedRiderId: null,
                area: payload.area ?? "Unknown",
                createdAt: new Date().toISOString()
              });
              break;

            case "rider_assigned":
              assignDelivery(payload.order_id, payload.rider_id);
              break;

            case "delivery_completed":
              updateDeliveryStatus(payload.order_id, "completed");
              break;

            case "delivery_failed":
              updateDeliveryStatus(payload.order_id, "failed");
              break;

            default:
              console.log(`[WebSocket] Unhandled payload type: ${event_type}`);
          }
        } catch (err) {
          console.error("[WebSocket] Failed parsing live JSON stream event:", err);
        }
      };

      ws.onclose = (event) => {
        console.warn(`[WebSocket] Connection closed: code=${event.code}, reason=${event.reason}`);
        setConnected(false);
        // Attempt reconnect with backoff after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error("[WebSocket] Gateway socket error:", error);
        ws.close();
      };
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [tenantId, updateRiderLocation, addDelivery, assignDelivery, updateDeliveryStatus]);

  return { connected, latestMessage };
}
