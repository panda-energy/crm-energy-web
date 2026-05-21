import { Suspense } from "react";
import { KanbanSkeleton } from "@/components/pipeline/kanban-skeleton";
import { PipelinePageClient } from "@/components/pipeline/pipeline-page-client";

/**
 * `/pipeline` — Vista Kanban del pipeline (F-2.2).
 *
 * Server Component delgado: el cliente vive en `PipelinePageClient` por
 * dos motivos:
 *  1. Necesita `useSearchParams()` (App Router) para el `?pipelineId=…`
 *     que hace shareable la vista por pipeline.
 *  2. Coordina TanStack Query + @dnd-kit, ambos client-only.
 *
 * `Suspense` cubre el primer paint mientras el cliente arranca queries.
 */
export const dynamic = "force-dynamic";

export default function PipelinePage() {
  return (
    <Suspense fallback={<KanbanSkeleton />}>
      <PipelinePageClient />
    </Suspense>
  );
}
