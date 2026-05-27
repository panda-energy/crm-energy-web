"use client";

import { Badge } from "@/components/ui/badge";
import type { TicketStatus } from "@/lib/api/types-sprint4";
import { cn } from "@/lib/utils/cn";

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; className: string }
> = {
  open: {
    label: "Abierto",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  in_progress: {
    label: "En progreso",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  waiting_customer: {
    label: "Esperando cliente",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
  resolved: {
    label: "Resuelto",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  closed: {
    label: "Cerrado",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  },
};

interface TicketStatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="secondary" className={cn("border-0 font-medium", config.className, className)}>
      {config.label}
    </Badge>
  );
}
