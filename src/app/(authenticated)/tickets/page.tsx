import { ComingSoonPlaceholder } from "@/components/layout/coming-soon-placeholder";

/**
 * `/tickets` — inbox unificado de atención al cliente.
 *
 * Stub Sprint 4.
 */
export default function TicketsPage() {
  return (
    <ComingSoonPlaceholder
      title="Tickets"
      description="Inbox unificado: WhatsApp, email y chat con SLA visible por ticket."
      sprintLabel="Sprint 4"
      iconKey="tickets"
      bullets={[
        "Inbox multicanal (WhatsApp Business, email, chat web) en una sola cola.",
        "Reloj de SLA por ticket con escalado automático al superar el umbral.",
        "Asignación rápida vía atajo o drag-and-drop entre agentes.",
        "Respuestas plantilla con variables y aprobación previa por supervisor.",
        "Threads conversacionales con histórico completo del cliente.",
      ]}
    />
  );
}
