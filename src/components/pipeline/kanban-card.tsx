"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { Lead } from "@/lib/api/hooks/use-leads";
import {
  composeInitials,
  composeLeadName,
  formatMoney,
} from "@/lib/leads/format";
import { formatRelativeTime } from "@/lib/leads/relative-time";

/**
 * Card de Lead arrastrable dentro de una columna Kanban (F-2.2).
 *
 * - `useSortable` lo convierte en draggable + droppable (las cards aceptan
 *   drop entre cards en sortable contexts).
 * - El handle visual de drag es la card entera — cualquier mousedown
 *   inicia el arrastre.
 * - Click sin drag → navega a `/leads/{id}` (el detalle se abre encima
 *   de la tabla `/leads`, no de `/pipeline`, pero el routing es shareable).
 * - Accesibilidad: @dnd-kit añade aria-roledescription/atomic; añadimos
 *   un label explícito y `tabIndex={0}` (heredado del componente sortable).
 */
export interface KanbanCardProps {
  lead: Lead;
  /** Si está en estado de arrastre activo (lo gestiona el padre via overlay). */
  isDragOverlay?: boolean;
  /** Si la mutación de move sobre este lead está en vuelo. */
  isMoving?: boolean;
}

const MAX_VISIBLE_TAGS = 3;

export function KanbanCard({
  lead,
  isDragOverlay,
  isMoving,
}: KanbanCardProps) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: { type: "lead", lead },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const visibleTags = lead.tags.slice(0, MAX_VISIBLE_TAGS);
  const remainingTags = lead.tags.length - visibleTags.length;
  const displayName = composeLeadName(lead);

  const handleClick = (e: React.MouseEvent) => {
    // reason: durante el arrastre, @dnd-kit suprime el click; pero por
    // seguridad ignoramos clicks con modifier (selecciones futuras) o si
    // el overlay está activo.
    if (isDragOverlay) return;
    if (e.shiftKey || e.metaKey || e.ctrlKey) return;
    router.push(`/leads/${lead.id}`);
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      aria-label={`Lead ${displayName}. Etapa: ${lead.status}. Pulsa espacio para arrastrar.`}
      data-dragging={isDragging || undefined}
      className={cn(
        "group relative w-full cursor-grab select-none rounded-md border border-border bg-surface p-3 text-left shadow-1",
        "transition hover:border-brand/40 hover:shadow-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isDragging && "opacity-50",
        isDragOverlay && "cursor-grabbing scale-[1.02] shadow-4 ring-2 ring-brand/40",
        isMoving && "pointer-events-none opacity-70",
      )}
    >
      {isMoving ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-md bg-foreground/5"
        />
      ) : null}

      <div className="flex items-start gap-2">
        <Avatar className="size-7 shrink-0 text-xs">
          <AvatarFallback>{composeInitials(lead)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {displayName}
          </p>
          {lead.company ? (
            <p className="truncate text-xs text-muted-foreground">
              {lead.company}
            </p>
          ) : null}
        </div>
        {lead.estimated_value_cents !== null ? (
          <span className="shrink-0 text-xs font-medium tabular-nums text-foreground">
            {formatMoney(lead.estimated_value_cents, lead.currency)}
          </span>
        ) : null}
      </div>

      {visibleTags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {visibleTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              {tag}
            </Badge>
          ))}
          {remainingTags > 0 ? (
            <Badge variant="outline" className="text-[10px]">
              +{remainingTags}
            </Badge>
          ) : null}
        </div>
      ) : null}

      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{formatRelativeTime(lead.last_contacted_at) || "Sin contacto"}</span>
        {lead.owner_id ? (
          <span className="font-mono">{lead.owner_id.slice(0, 6)}…</span>
        ) : (
          <span className="italic">Sin asignar</span>
        )}
      </div>
    </article>
  );
}
