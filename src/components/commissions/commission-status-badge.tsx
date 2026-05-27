"use client";

import { Badge } from "@/components/ui/badge";
import type { CommissionStatus } from "@/lib/api/types-sprint5";

const CONFIG: Record<
  CommissionStatus,
  { label: string; variant: "default" | "warning" | "success" | "destructive" | "secondary" }
> = {
  pending: { label: "Pendiente", variant: "warning" },
  approved: { label: "Aprobada", variant: "default" },
  paid: { label: "Pagada", variant: "success" },
  cancelled: { label: "Cancelada", variant: "destructive" },
};

export function CommissionStatusBadge({
  status,
}: {
  status: CommissionStatus;
}) {
  const { label, variant } = CONFIG[status];
  return <Badge variant={variant}>{label}</Badge>;
}
