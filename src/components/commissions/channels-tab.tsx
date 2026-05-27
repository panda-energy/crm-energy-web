"use client";

import { useChannels } from "@/lib/api/hooks/use-channels";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2 } from "lucide-react";
import { ChannelCard } from "./channel-card";
import type { Channel } from "@/lib/api/types-sprint5";

/**
 * ChannelsTab -- hierarchical view of sales channels.
 *
 * Renders parent channels first, then children indented below them.
 */

function buildHierarchy(channels: Channel[]) {
  const parents = channels.filter((c) => !c.parent_id);
  const children = channels.filter((c) => c.parent_id);

  const result: Array<{ channel: Channel; isChild: boolean }> = [];
  for (const parent of parents) {
    result.push({ channel: parent, isChild: false });
    const kids = children.filter((c) => c.parent_id === parent.id);
    for (const kid of kids) {
      result.push({ channel: kid, isChild: true });
    }
  }
  // Orphan children (parent not in list)
  const usedIds = new Set(result.map((r) => r.channel.id));
  for (const child of children) {
    if (!usedIds.has(child.id)) {
      result.push({ channel: child, isChild: true });
    }
  }
  return result;
}

export function ChannelsTab() {
  const { data: channels, isLoading, isError, error } = useChannels();

  if (isLoading) {
    return (
      <div className="space-y-3" role="status" aria-label="Cargando canales">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<Building2 />}
        title="Error al cargar canales"
        description={error?.message}
      />
    );
  }

  if (!channels || channels.length === 0) {
    return (
      <EmptyState
        icon={<Building2 />}
        title="Sin canales configurados"
        description="Configura tu primer canal de venta para empezar a registrar comisiones."
      />
    );
  }

  const hierarchy = buildHierarchy(channels);

  return (
    <div className="space-y-3">
      {hierarchy.map(({ channel, isChild }) => (
        <ChannelCard
          key={channel.id}
          channel={channel}
          isChild={isChild}
        />
      ))}
    </div>
  );
}
