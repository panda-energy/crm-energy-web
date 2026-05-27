"use client";

import type { Ticket } from "@/lib/api/types-sprint4";

interface TicketConversationProps {
  ticket: Ticket;
}

/**
 * Stub — full implementation in F-4.6.
 */
export function TicketConversation({ ticket }: TicketConversationProps) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Selecciona un ticket para ver la conversacion
    </div>
  );
}
