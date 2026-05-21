import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

/**
 * TableSkeleton — placeholder de una tabla mientras carga.
 *
 * Props:
 *  - `rows` (default 6): filas placeholder.
 *  - `cols` (default 4): columnas placeholder.
 *
 * Diseño:
 *  - Cabecera más opaca / más alta para evocar `<thead>`.
 *  - Cuerpo: bloques con alturas pseudo-aleatorias controladas por índice
 *    para evitar el patrón "líneas pegadas" que se ve fake.
 *  - `role="status"` + `aria-busy` + texto sr-only para anuncio único a SR.
 */
export interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  className?: string;
  /** Etiqueta para SR. Default: "Cargando datos…". */
  ariaLabel?: string;
}

export function TableSkeleton({
  rows = 6,
  cols = 4,
  className,
  ariaLabel = "Cargando datos…",
}: TableSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(
        "w-full overflow-hidden rounded-lg border border-border bg-surface",
        className,
      )}
    >
      <span className="sr-only">{ariaLabel}</span>
      {/* Cabecera */}
      <div
        className="grid gap-4 border-b border-border bg-muted/40 px-4 py-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 w-3/4" />
        ))}
      </div>
      {/* Filas */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={`r-${rowIdx}`}
            className="grid gap-4 px-4 py-3"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: cols }).map((_, colIdx) => (
              <Skeleton
                key={`r-${rowIdx}-c-${colIdx}`}
                // Anchos variables determinísticos para no aburrir la vista.
                className={cn(
                  "h-4",
                  (rowIdx + colIdx) % 3 === 0 && "w-1/2",
                  (rowIdx + colIdx) % 3 === 1 && "w-3/4",
                  (rowIdx + colIdx) % 3 === 2 && "w-2/3",
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
