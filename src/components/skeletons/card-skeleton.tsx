import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

/**
 * CardSkeleton — placeholder de una card típica (header + 2 líneas + footer).
 *
 * Útil para grids de cards (dashboards, listas de productos, etc.). Para
 * tablas usa `TableSkeleton`; para paneles de detalle, `DetailPanelSkeleton`.
 */
export interface CardSkeletonProps {
  /** Cantidad de cards a renderizar (default 1). */
  count?: number;
  className?: string;
  ariaLabel?: string;
}

export function CardSkeleton({
  count = 1,
  className,
  ariaLabel = "Cargando contenido…",
}: CardSkeletonProps) {
  if (count === 1) {
    return (
      <article
        role="status"
        aria-busy="true"
        aria-live="polite"
        className={cn(
          "rounded-lg border border-border bg-surface p-6 shadow-1",
          className,
        )}
      >
        <span className="sr-only">{ariaLabel}</span>
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
        <Skeleton className="mt-6 h-8 w-24" />
      </article>
    );
  }

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      <span className="sr-only">{ariaLabel}</span>
      {Array.from({ length: count }).map((_, i) => (
        <article
          key={`c-${i}`}
          className="rounded-lg border border-border bg-surface p-6 shadow-1"
        >
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-5/6" />
          <Skeleton className="mt-6 h-8 w-24" />
        </article>
      ))}
    </div>
  );
}
