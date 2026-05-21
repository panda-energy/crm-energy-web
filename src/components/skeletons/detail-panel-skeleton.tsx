import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

/**
 * DetailPanelSkeleton — placeholder de un panel lateral / vista de detalle.
 *
 * Estructura: avatar + título + meta + bloque de tabs + sección de campos.
 * Diseñado para `<Sheet side="right">` (panel de detalle de Lead, CUPS, etc.).
 */
export interface DetailPanelSkeletonProps {
  className?: string;
  ariaLabel?: string;
}

export function DetailPanelSkeleton({
  className,
  ariaLabel = "Cargando detalle…",
}: DetailPanelSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn("space-y-6", className)}
    >
      <span className="sr-only">{ariaLabel}</span>

      {/* Header: avatar + título + meta */}
      <div className="flex items-start gap-4">
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b border-border pb-2">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-7 w-16" />
      </div>

      {/* Campos clave */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`f-${i}`} className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className={cn("h-4", i % 2 === 0 ? "w-5/6" : "w-3/4")} />
          </div>
        ))}
      </div>
    </div>
  );
}
