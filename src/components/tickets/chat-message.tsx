"use client";

import type { TicketMessage } from "@/lib/api/types-sprint4";
import { cn } from "@/lib/utils/cn";
import { TicketChannelIcon } from "./ticket-channel-icon";

interface ChatMessageProps {
  message: TicketMessage;
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAgent = message.sender_type === "agent";
  const isSystem = message.sender_type === "system";
  const isCustomer = message.sender_type === "customer";

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <div className="max-w-sm rounded-md bg-muted/50 px-3 py-1.5 text-center text-xs text-muted-foreground">
          {message.body}
          <span className="ml-2 text-[10px]">{formatTime(message.created_at)}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-2 py-1",
        isAgent ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-xl px-3 py-2",
          isAgent
            ? "bg-brand/10 text-foreground dark:bg-brand/20"
            : "bg-muted text-foreground",
        )}
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-medium text-muted-foreground">
            {isAgent ? "Agente" : "Cliente"}
          </span>
          <TicketChannelIcon channel={message.channel} className="[&_svg]:size-3" />
        </div>
        <p className="text-sm whitespace-pre-wrap">{message.body}</p>
        <span className="mt-1 block text-right text-[10px] text-muted-foreground">
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}

/**
 * Date separator between message groups.
 */
export function ChatDateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground">{formatDate(date)}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
