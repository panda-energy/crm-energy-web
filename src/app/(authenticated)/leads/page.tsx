import { Suspense } from "react";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { LeadsPageClient } from "./leads-page-client";

/**
 * `/leads` — vista tabla de leads con filtros (F-2.1).
 *
 * El cliente lee filtros desde `useSearchParams`, que en Next 15 con App
 * Router REQUIERE estar dentro de un `<Suspense>` boundary o el build
 * estático falla (`useSearchParams() should be wrapped in a suspense
 * boundary`). El skeleton también sirve como fallback inicial al SSR.
 */
export default function LeadsPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} cols={8} />}>
      <LeadsPageClient />
    </Suspense>
  );
}
