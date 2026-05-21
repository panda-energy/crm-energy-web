import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Skeleton — bloque placeholder con shimmer mientras carga.
 *
 * Reglas:
 *  - Sustituye spinners en contenedores grandes (DoD: "skeletons, no spinners").
 *  - Usa tokens (`bg-muted`) — sigue dark mode sin tocar JSX.
 *  - El `<role="status" aria-live="polite">` lo añade el componente padre
 *    (`TableSkeleton`, `CardSkeleton`, etc.) — los skeletons sueltos no se
 *    anuncian individualmente para no saturar a SR.
 *  - Animación: `animate-pulse` de Tailwind v4 (built-in).
 */
export const Skeleton = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Skeleton({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        // reason: aria-hidden por defecto; el contenedor padre debe anunciar
        // "Cargando..." una vez (ver TableSkeleton, etc.).
        aria-hidden="true"
        className={cn("animate-pulse rounded-md bg-muted", className)}
        {...props}
      />
    );
  },
);
