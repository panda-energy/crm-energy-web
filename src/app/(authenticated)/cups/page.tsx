import { Suspense } from "react";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { CupsPageClient } from "@/components/cups/cups-page-client";

/**
 * `/cups` - gestion de puntos de suministro (CUPS) (F-3.1).
 *
 * Server component wrapper with Suspense boundary for useSearchParams.
 */
export default function CupsPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} cols={7} />}>
      <CupsPageClient />
    </Suspense>
  );
}
