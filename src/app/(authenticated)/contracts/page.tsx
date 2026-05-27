import { Suspense } from "react";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { ContractsPageClient } from "@/components/contracts/contracts-page-client";

/**
 * `/contracts` — tabla de contratos con detalle, firma y acciones (F-3.6).
 */
export default function ContractsPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} cols={6} />}>
      <ContractsPageClient />
    </Suspense>
  );
}
