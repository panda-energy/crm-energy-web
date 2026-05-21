import { Suspense } from "react";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { LeadsPageClient } from "../leads-page-client";

/**
 * `/leads/[leadId]` — misma vista que `/leads` pero con el Sheet de detalle
 * abierto encima (F-2.4).
 *
 * Decisión arquitectónica:
 *  - La tabla NO se desmonta entre `/leads` ↔ `/leads/{id}`. Renderizamos el
 *    mismo `LeadsPageClient`; el `leadId` solo activa el Sheet.
 *  - Esto permite shareable URLs (la URL es la fuente de verdad) y al cerrar
 *    el Sheet `router.back()` o `replace('/leads')` mantiene el contexto.
 *
 * Next 15 cambió `params` a Promise. Lo desempaquetamos con `await`.
 */
interface LeadDetailRouteParams {
  params: Promise<{ leadId: string }>;
}

export default async function LeadDetailPage({
  params,
}: LeadDetailRouteParams) {
  const { leadId } = await params;
  return (
    <Suspense fallback={<TableSkeleton rows={8} cols={8} />}>
      <LeadsPageClient detailLeadId={leadId} />
    </Suspense>
  );
}
