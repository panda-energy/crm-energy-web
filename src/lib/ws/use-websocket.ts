"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/ui/toast";

/**
 * WebSocket connection status.
 */
export type WsStatus = "connected" | "connecting" | "disconnected";

/**
 * Simulated WebSocket event types.
 */
export type WsEventType =
  | "atr_processed"
  | "atr_rejected"
  | "new_ticket"
  | "ticket_updated"
  | "lead_assigned";

export interface WsEvent {
  type: WsEventType;
  id: string;
  message: string;
  timestamp: string;
}

type WsCallback = (event: WsEvent) => void;

/**
 * useWebSocket — simulated WebSocket client for demo mode.
 *
 * In production this would connect to a real WS endpoint. In demo mode
 * it generates fake events every 30s to show the live indicator and
 * trigger query invalidation.
 *
 * Features:
 *  - Status: connected/connecting/disconnected
 *  - Event subscription by type
 *  - Auto-invalidation of relevant queries
 *  - Toast notifications for important events
 */
export function useWebSocket() {
  const [status, setStatus] = useState<WsStatus>("disconnected");
  const [lastEvent, setLastEvent] = useState<WsEvent | null>(null);
  const queryClient = useQueryClient();
  const subscribersRef = useRef<Map<WsEventType, Set<WsCallback>>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const subscribe = useCallback((type: WsEventType, callback: WsCallback) => {
    if (!subscribersRef.current.has(type)) {
      subscribersRef.current.set(type, new Set());
    }
    subscribersRef.current.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      subscribersRef.current.get(type)?.delete(callback);
    };
  }, []);

  const emitEvent = useCallback(
    (event: WsEvent) => {
      setLastEvent(event);

      // Notify subscribers
      const subs = subscribersRef.current.get(event.type);
      if (subs) {
        for (const cb of subs) {
          cb(event);
        }
      }

      // Invalidate relevant queries
      switch (event.type) {
        case "atr_processed":
        case "atr_rejected":
          void queryClient.invalidateQueries({
            queryKey: ["/v1/atr/messages"],
          });
          break;
        case "new_ticket":
        case "ticket_updated":
          void queryClient.invalidateQueries({
            queryKey: ["/v1/tickets"],
          });
          break;
        case "lead_assigned":
          void queryClient.invalidateQueries({
            queryKey: ["/v1/leads"],
          });
          break;
      }

      // Toast for important events
      switch (event.type) {
        case "atr_processed":
          toast.info(event.message);
          break;
        case "atr_rejected":
          toast.warning(event.message);
          break;
        case "new_ticket":
          toast.info(event.message);
          break;
      }
    },
    [queryClient],
  );

  useEffect(() => {
    // Simulate connection
    setStatus("connecting");
    const connectTimeout = setTimeout(() => {
      setStatus("connected");

      // Generate fake events every 30s
      intervalRef.current = setInterval(() => {
        const event = generateFakeEvent();
        emitEvent(event);
      }, 30_000);
    }, 1_500);

    return () => {
      clearTimeout(connectTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setStatus("disconnected");
    };
  }, [emitEvent]);

  return { status, lastEvent, subscribe };
}

// ── Fake event generation ───────────────────────────────────────────────────

const EVENT_TEMPLATES: { type: WsEventType; message: string }[] = [
  {
    type: "atr_processed",
    message: "ATR C1 procesado - CUPS ES0021000011223344AA",
  },
  {
    type: "atr_rejected",
    message: "ATR A3 rechazado - Error de potencia en distribuidora",
  },
  {
    type: "new_ticket",
    message: "Nuevo ticket: Consulta sobre facturacion",
  },
  {
    type: "ticket_updated",
    message: "Ticket #T-0003 actualizado por cliente",
  },
  { type: "lead_assigned", message: "Lead asignado a Carlos Ruiz" },
];

let eventCounter = 0;

function generateFakeEvent(): WsEvent {
  eventCounter += 1;
  const template =
    EVENT_TEMPLATES[eventCounter % EVENT_TEMPLATES.length]!;
  return {
    type: template.type,
    id: `ws-event-${eventCounter}`,
    message: template.message,
    timestamp: new Date().toISOString(),
  };
}
