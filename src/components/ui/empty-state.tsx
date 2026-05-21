import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * EmptyState — placeholder visual cuando una lista/tabla está vacía.
 *
 * Patrón UX obligatorio (BACKLOG §Patrones UX):
 *  > "Sin resultados" con ilustración + CTA "crear nuevo".
 *
 * Composición:
 *   <EmptyState
 *     icon={<UsersIcon />}
 *     title="Aún no hay leads"
 *     description="Crea el primero o conecta tus campañas para que lleguen solos."
 *     action={<Button>Crear lead</Button>}
 *   />
 *
 * Accesibilidad:
 *  - `<section role="status">` para que SR anuncie el cambio cuando aparece
 *    tras una búsqueda sin resultados.
 *  - El icono va con `aria-hidden` desde el caller (recordatorio implícito).
 */
export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <section
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-surface/50 px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-6"
        >
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </section>
  );
}
