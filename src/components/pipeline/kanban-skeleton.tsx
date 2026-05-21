import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton del Pipeline Kanban — render mientras carga la primera vez.
 * Cinco columnas (mismo nº que la pipeline default seeded por el backend),
 * tres cards placeholder por columna.
 */
export function KanbanSkeleton() {
  return (
    <div
      className="flex flex-1 gap-3 overflow-x-auto pb-2"
      role="status"
      aria-busy="true"
      aria-label="Cargando pipeline…"
    >
      <span className="sr-only">Cargando pipeline…</span>
      {Array.from({ length: 5 }).map((_, colIdx) => (
        <div
          key={colIdx}
          className="flex h-full w-72 shrink-0 flex-col rounded-lg border border-border bg-muted/30"
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="flex flex-col gap-2 p-2">
            {Array.from({ length: 3 }).map((__, cardIdx) => (
              <Skeleton key={cardIdx} className="h-24 w-full rounded-md" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
