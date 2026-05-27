import { TicketsPageClient } from "@/components/tickets/tickets-page-client";

/**
 * `/tickets` — inbox unificado de atencion al cliente.
 *
 * Server component shell — delegates to TicketsPageClient for interactivity.
 */
export default function TicketsPage() {
  return <TicketsPageClient />;
}
