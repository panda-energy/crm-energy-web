"use client";

import { useWebSocket, type WsStatus } from "@/lib/ws/use-websocket";
import { cn } from "@/lib/utils/cn";

const STATUS_CONFIG: Record<
  WsStatus,
  { label: string; dotClass: string; textClass: string }
> = {
  connected: {
    label: "Live",
    dotClass: "bg-green-500",
    textClass: "text-green-700 dark:text-green-400",
  },
  connecting: {
    label: "Connecting",
    dotClass: "bg-yellow-500 animate-pulse",
    textClass: "text-yellow-700 dark:text-yellow-400",
  },
  disconnected: {
    label: "Offline",
    dotClass: "bg-red-500",
    textClass: "text-red-700 dark:text-red-400",
  },
};

/**
 * Live connection indicator for the topbar.
 * Shows a colored dot + label indicating WebSocket status.
 */
export function LiveIndicator() {
  const { status } = useWebSocket();
  const config = STATUS_CONFIG[status];

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
        config.textClass,
      )}
      role="status"
      aria-label={`Estado de conexion: ${config.label}`}
    >
      <span
        className={cn("size-2 rounded-full", config.dotClass)}
        aria-hidden
      />
      {config.label}
    </div>
  );
}
