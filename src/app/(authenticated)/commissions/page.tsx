import { ComingSoonPlaceholder } from "@/components/layout/coming-soon-placeholder";

/**
 * `/commissions` — gestión de canales, jerarquías y liquidaciones.
 *
 * Stub Sprint 5.
 */
export default function CommissionsPage() {
  return (
    <ComingSoonPlaceholder
      title="Comisiones"
      description="Canales, jerarquías de agentes y liquidaciones automáticas."
      sprintLabel="Sprint 5"
      iconKey="commissions"
      bullets={[
        "Jerarquía visual de canales con drag-and-drop para reorganizar.",
        "Cálculo automático por contrato según reglas configurables.",
        "Tabla de liquidaciones con estados (pendiente, aprobado, pagado).",
        "Export CSV/PDF de liquidaciones por agente, periodo o canal.",
        "Histórico de cambios en reglas con efecto temporal (no retroactivo).",
      ]}
    />
  );
}
