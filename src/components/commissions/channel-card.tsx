"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { Users, ToggleRight, ToggleLeft } from "lucide-react";
import type { Channel, ChannelType } from "@/lib/api/types-sprint5";

const TYPE_LABELS: Record<ChannelType, string> = {
  direct: "Directo",
  agency: "Agencia",
  partner: "Partner",
  online: "Online",
};

const TYPE_VARIANTS: Record<
  ChannelType,
  "default" | "secondary" | "success" | "warning"
> = {
  direct: "default",
  agency: "secondary",
  partner: "success",
  online: "warning",
};

/**
 * ChannelCard -- visual card for a sales channel in the hierarchy.
 *
 * Shows type badge, commission rate, agent count, active toggle.
 * Indented when it's a child channel (parent_id !== null).
 */
export interface ChannelCardProps {
  channel: Channel;
  isChild?: boolean;
  className?: string;
}

export function ChannelCard({
  channel,
  isChild = false,
  className,
}: ChannelCardProps) {
  return (
    <Card
      className={cn(
        "transition-colors",
        !channel.active && "opacity-60",
        isChild && "ml-8 border-l-2 border-l-brand/30",
        className,
      )}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{channel.name}</h3>
            <Badge variant={TYPE_VARIANTS[channel.type]}>
              {TYPE_LABELS[channel.type]}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Comision: {channel.commission_rate_pct}%</span>
            <span className="flex items-center gap-1">
              <Users className="size-3" aria-hidden />
              {channel.agents_count} agentes
            </span>
          </div>
        </div>
        <div className="shrink-0 text-muted-foreground" title={channel.active ? "Activo" : "Inactivo"}>
          {channel.active ? (
            <ToggleRight className="size-5 text-success" aria-label="Activo" />
          ) : (
            <ToggleLeft className="size-5" aria-label="Inactivo" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
