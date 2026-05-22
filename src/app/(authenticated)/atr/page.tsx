import { ComingSoonPlaceholder } from "@/components/layout/coming-soon-placeholder";

/**
 * `/atr` — monitorización de mensajes regulatorios ATR.
 *
 * Stub Sprint 4.
 */
export default function AtrPage() {
  return (
    <ComingSoonPlaceholder
      title="Monitorización ATR"
      description="Mensajes ATR (CNMC), estados, reintentos y SLA por distribuidora."
      sprintLabel="Sprint 4"
      iconKey="atr"
      bullets={[
        "Tabla XML filtrada por distribuidora, tipo de mensaje y fecha.",
        "Estados visibles: enviado, aceptado, rechazado, retirado.",
        "Reintento manual con un click y log de auditoría completo.",
        "Comparador side-by-side de versiones XML antes/después de la corrección.",
        "Dashboard SLA por distribuidora: tiempo medio, percentiles, alertas.",
      ]}
    />
  );
}
