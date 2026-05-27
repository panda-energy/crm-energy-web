"use client";

import { Badge } from "@/components/ui/badge";
import type { InvoiceStatus } from "@/lib/api/types-sprint5";

const CONFIG: Record<
  InvoiceStatus,
  { label: string; variant: "success" | "warning" | "destructive" }
> = {
  paid: { label: "Pagada", variant: "success" },
  pending: { label: "Pendiente", variant: "warning" },
  overdue: { label: "Vencida", variant: "destructive" },
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { label, variant } = CONFIG[status];
  return <Badge variant={variant}>{label}</Badge>;
}
