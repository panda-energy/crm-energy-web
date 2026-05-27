"use client";

import { Badge } from "@/components/ui/badge";
import type { AtrMessageStatus } from "@/lib/api/types-sprint4";
import { cn } from "@/lib/utils/cn";

const STATUS_CONFIG: Record<
  AtrMessageStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pendiente",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  sent: {
    label: "Enviado",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  ack_received: {
    label: "ACK recibido",
    className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  },
  processed: {
    label: "Procesado",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  rejected: {
    label: "Rechazado",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
  timeout: {
    label: "Timeout",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  },
};

interface AtrStatusBadgeProps {
  status: AtrMessageStatus;
  className?: string;
}

export function AtrStatusBadge({ status, className }: AtrStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant="secondary"
      className={cn(
        "border-0 font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </Badge>
  );
}
