"use client";

import { Badge } from "@/components/ui/badge";
import type { components } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

type ContractStatus = components["schemas"]["ContractStatus"];

const STATUS_CONFIG: Record<
  ContractStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Borrador",
    className: "bg-muted text-muted-foreground",
  },
  signed: {
    label: "Firmado",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  },
  sent_to_dso: {
    label: "Enviado a distribuidora",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  active: {
    label: "Activo",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  rejected: {
    label: "Rechazado",
    className: "bg-red-500/15 text-red-700 dark:text-red-400",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
  },
};

export function ContractStatusBadge({
  status,
}: {
  status: ContractStatus;
}) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
