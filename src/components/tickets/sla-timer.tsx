"use client";

import { useMemo } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SlaTimerProps {
  deadline: string | null;
  breached: boolean;
  className?: string;
}

/**
 * SLA countdown timer. Shows remaining time or "SLA superado" if breached.
 */
export function SlaTimer({ deadline, breached, className }: SlaTimerProps) {
  const display = useMemo(() => {
    if (!deadline) return null;
    if (breached) return { text: "SLA superado", isOverdue: true };

    const now = Date.now();
    const target = new Date(deadline).getTime();
    const diffMs = target - now;

    if (diffMs <= 0) return { text: "SLA superado", isOverdue: true };

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return {
        text: `${days}d ${hours % 24}h`,
        isOverdue: false,
      };
    }

    return {
      text: `${hours}h ${minutes}m`,
      isOverdue: false,
    };
  }, [deadline, breached]);

  if (!display) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        display.isOverdue
          ? "text-red-600 dark:text-red-400"
          : "text-muted-foreground",
        className,
      )}
    >
      {display.isOverdue ? (
        <AlertTriangle className="size-3" aria-hidden />
      ) : (
        <Clock className="size-3" aria-hidden />
      )}
      {display.text}
    </span>
  );
}
