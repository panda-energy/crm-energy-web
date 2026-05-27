"use client";

import { Badge } from "@/components/ui/badge";
import type { TicketPriority } from "@/lib/api/types-sprint4";
import { cn } from "@/lib/utils/cn";

const PRIORITY_CONFIG: Record<
  TicketPriority,
  { label: string; className: string }
> = {
  low: {
    label: "Baja",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  medium: {
    label: "Media",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  high: {
    label: "Alta",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  },
  urgent: {
    label: "Urgente",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
};

interface TicketPriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
}

export function TicketPriorityBadge({ priority, className }: TicketPriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <Badge variant="secondary" className={cn("border-0 text-xs font-medium", config.className, className)}>
      {config.label}
    </Badge>
  );
}
