"use client";

import { LayoutList, ListOrdered } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Toggle de vista de leads — Tabla | Timeline.
 *
 * Vive aparte del `LeadsPageClient` para mantener ese fichero <300 líneas
 * (regla cross-skill #15). El estado lo controla el caller; este componente
 * solo renderiza el control y dispara `onChange`.
 *
 * El Kanban es una ruta distinta (`/pipeline`), no parte de este toggle:
 * separamos vistas que comparten dataset (Tabla/Timeline) de las que tienen
 * arquitectura distinta (Kanban).
 *
 * Accesibilidad:
 *  - `role="group"` + `aria-label` para que SR anuncie el grupo.
 *  - `aria-pressed` en cada botón para el estado activo.
 *  - Focus visible con ring del design system.
 */
export type LeadsView = "table" | "timeline";

export interface LeadsViewToggleProps {
  value: LeadsView;
  onChange: (next: LeadsView) => void;
}

export function LeadsViewToggle({ value, onChange }: LeadsViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Cambiar vista de leads"
      className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 p-0.5"
    >
      <LeadsViewToggleButton
        active={value === "table"}
        onClick={() => onChange("table")}
        label="Tabla"
        icon={<LayoutList className="size-4" aria-hidden />}
      />
      <LeadsViewToggleButton
        active={value === "timeline"}
        onClick={() => onChange("timeline")}
        label="Timeline"
        icon={<ListOrdered className="size-4" aria-hidden />}
      />
    </div>
  );
}

function LeadsViewToggleButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        active
          ? "bg-surface text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
