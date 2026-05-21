import { Badge, type BadgeProps } from "@/components/ui/badge";
import { LEAD_STATUS_LABELS } from "@/lib/leads/format";
import type { Lead } from "@/lib/api/hooks/use-leads";

/**
 * Badge específico para `LeadStatus` con color por bucket coarse.
 *
 * Mapeo a variantes del design system (tokens, sin colores hardcoded):
 *   new        → secondary  (neutro)
 *   contacted  → default    (brand)
 *   qualified  → warning    (atención, atender lead activo)
 *   won        → success
 *   lost       → destructive
 *
 * Si entra un status nuevo del backend (regla cross-skill #7), cae a
 * `outline` y se loguea — así la UI no rompe pero el dev nota la
 * desincronización.
 */
const STATUS_VARIANT: Record<Lead["status"], BadgeProps["variant"]> = {
  new: "secondary",
  contacted: "default",
  qualified: "warning",
  won: "success",
  lost: "destructive",
};

export interface LeadStatusBadgeProps {
  status: Lead["status"];
  className?: string;
}

export function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
  const variant = STATUS_VARIANT[status] ?? "outline";
  const label = LEAD_STATUS_LABELS[status] ?? status;
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
