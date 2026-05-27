"use client";

import { Badge } from "@/components/ui/badge";
import type { AtrMessageType } from "@/lib/api/types-sprint4";
import { cn } from "@/lib/utils/cn";

const TYPE_LABELS: Record<AtrMessageType, string> = {
  C1: "C1 - Cambio comercializador",
  A3: "A3 - Alta nuevo suministro",
  B1: "B1 - Baja suministro",
  M1: "M1 - Modificacion contrato",
  R1: "R1 - Reclamacion",
};

const TYPE_SHORT: Record<AtrMessageType, string> = {
  C1: "C1",
  A3: "A3",
  B1: "B1",
  M1: "M1",
  R1: "R1",
};

interface AtrMessageTypeBadgeProps {
  type: AtrMessageType;
  short?: boolean;
  className?: string;
}

export function AtrMessageTypeBadge({
  type,
  short = false,
  className,
}: AtrMessageTypeBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("font-mono text-xs", className)}
      title={TYPE_LABELS[type]}
    >
      {short ? TYPE_SHORT[type] : TYPE_LABELS[type]}
    </Badge>
  );
}

export { TYPE_LABELS as ATR_TYPE_LABELS };
