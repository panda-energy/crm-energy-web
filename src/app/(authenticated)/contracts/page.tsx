import { ComingSoonPlaceholder } from "@/components/layout/coming-soon-placeholder";

/**
 * `/contracts` — wizard de contratación y catálogo de contratos.
 *
 * Stub Sprint 3.
 */
export default function ContractsPage() {
  return (
    <ComingSoonPlaceholder
      title="Contratos"
      description="Wizard de contratación: lead → CUPS → producto → firma."
      sprintLabel="Sprint 3"
      iconKey="contracts"
      bullets={[
        "Wizard guiado de 4 pasos con validación cruzada por backend.",
        "Selector de producto con simulación de ahorro vs. factura actual.",
        "Firma digital integrada con Signaturit (envío automático al cliente).",
        "Generación automática del XML ATR C1 al firmar y envío a distribuidora.",
        "Estados visibles en tiempo real: borrador, enviado, firmado, activo.",
      ]}
    />
  );
}
