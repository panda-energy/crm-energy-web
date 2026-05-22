import { ComingSoonPlaceholder } from "@/components/layout/coming-soon-placeholder";

/**
 * `/cups` — gestión de puntos de suministro (CUPS).
 *
 * Stub Sprint 3: aún no fetcha datos. Comunica el roadmap durante la demo.
 */
export default function CupsPage() {
  return (
    <ComingSoonPlaceholder
      title="Gestión de CUPS"
      description="Consulta SIPS, histórico de consumo y validación de puntos de suministro."
      sprintLabel="Sprint 3"
      iconKey="cups"
      bullets={[
        "Lookup contra CNMC con búsqueda por CUPS o titular.",
        "Datos SIPS completos: tarifa, distribuidora, potencias contratadas.",
        "Histórico de consumo de 12 meses con gráfico mensual.",
        "Validación automática del formato (22 caracteres, prefijo ES).",
        "Vinculación rápida del CUPS a un lead o contrato.",
      ]}
    />
  );
}
