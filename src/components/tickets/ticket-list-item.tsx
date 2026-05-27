"use client";

import type { Ticket } from "@/lib/api/types-sprint4";
import { TicketStatusBadge } from "./ticket-status-badge";
import { TicketPriorityBadge } from "./ticket-priority-badge";
import { TicketChannelIcon } from "./ticket-channel-icon";
import { SlaTimer } from "./sla-timer";
import { cn } from "@/lib/utils/cn";

interface TicketListItemProps {
  ticket: Ticket;
  isSelected: boolean;
  onClick: () => void;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export function TicketListItem({
  ticket,
  isSelected,
  onClick,
}: TicketListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 border-b border-border transition-colors",
        "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        isSelected && "bg-muted",
        ticket.sla_breached && "border-l-2 border-l-red-500",
      )}
      aria-current={isSelected ? "true" : undefined}
    >
      <div className="flex items-start gap-2">
        <TicketChannelIcon channel={ticket.channel} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{ticket.subject}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
            <SlaTimer
              deadline={ticket.sla_deadline}
              breached={ticket.sla_breached}
            />
          </div>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatRelativeTime(ticket.updated_at)}
        </span>
      </div>
    </button>
  );
}
