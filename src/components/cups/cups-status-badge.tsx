"use client";

import { Badge } from "@/components/ui/badge";
import type { components } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

type CupsStatus = components["schemas"]["CupsStatus"];

const STATUS_CONFIG: Record<
  CupsStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Borrador",
    className: "bg-muted text-muted-foreground",
  },
  active: {
    label: "Activo",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  switching: {
    label: "En cambio",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  inactive: {
    label: "Inactivo",
    className: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
  },
};

export function CupsStatusBadge({ status }: { status: CupsStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
