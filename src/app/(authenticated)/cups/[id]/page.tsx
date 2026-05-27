import { Suspense } from "react";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { CupsPageClient } from "@/components/cups/cups-page-client";

/**
 * `/cups/[id]` - detalle CUPS abierto automáticamente (F-3.2).
 *
 * Re-usa CupsPageClient con el detailCupsId pre-abierto.
 * El Sheet se muestra encima de la tabla igual que /leads/[leadId].
 */
export default async function CupsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<TableSkeleton rows={8} cols={7} />}>
      <CupsPageClient detailCupsId={id} />
    </Suspense>
  );
}
