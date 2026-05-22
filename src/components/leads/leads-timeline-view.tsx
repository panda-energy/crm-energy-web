"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { Lead } from "@/lib/api/hooks/use-leads";
import {
  groupLeadsByMonth,
  type LeadTimelineGroup,
} from "@/lib/leads/timeline-grouping";
import { cn } from "@/lib/utils/cn";

import {
  TimelineLeadCard,
  TimelineMonthHeader,
  TimelineSkeleton,
} from "./leads-timeline-parts";

/**
 * Vista Timeline de leads (F-2.3).
 *
 * Lee la misma página paginada que la tabla (`Lead[]` ya filtrado por el
 * sidebar). NO fetcha: server-state lo controla el caller para que filtros
 * y paginación funcionen sin duplicar lógica.
 *
 * Layout:
 *  - Vertical reverso por mes (más reciente arriba). Header sticky con el
 *    nombre del mes + contador.
 *  - Cada lead-card pequeña: avatar + nombre + status + último contacto
 *    relativo + tags (max 2 + N) + badges de estancamiento.
 *  - Click → navega a `/leads/{id}`.
 *
 * Virtualización:
 *  - Si total > 50, virtualizamos a nivel de FLAT INDEX (filas = headers +
 *    cards). Los headers del mes se inyectan inline en el stream de items
 *    virtualizados con `kind: 'header' | 'lead'`.
 *
 * Estados:
 *  - `loading` → skeleton (3 grupos sintéticos).
 *  - sin leads + filtros activos → empty con CTA "Limpiar filtros".
 *  - sin leads global → empty con CTA "Crear lead".
 *  - filas → render.
 */

const VIRTUALIZE_THRESHOLD = 50;

type FlatItem =
  | { kind: "header"; group: LeadTimelineGroup; key: string }
  | { kind: "lead"; lead: Lead; key: string };

export interface LeadsTimelineViewProps {
  /** Leads a renderizar (página actual, ya filtrada). */
  data: Lead[];
  isLoading?: boolean;
  isRefetching?: boolean;
  /** Si hay filtros activos: cambia el empty state. */
  hasActiveFilters: boolean;
  /** CTA del empty state — abre el sheet de crear lead. */
  onCreateLead: () => void;
  /** CTA del empty state filtrado — limpia los filtros. */
  onClearFilters: () => void;
  /** Hora "actual" para test/Storybook determinista. Default: `new Date()`. */
  now?: Date;
}

export function LeadsTimelineView({
  data,
  isLoading,
  isRefetching,
  hasActiveFilters,
  onCreateLead,
  onClearFilters,
  now,
}: LeadsTimelineViewProps) {
  if (isLoading) {
    return <TimelineSkeleton />;
  }

  if (data.length === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          icon={<Users />}
          title="Sin resultados con estos filtros"
          description="Prueba a quitar alguno o cambiar el rango de fechas."
          action={
            <Button variant="outline" onClick={onClearFilters}>
              Limpiar filtros
            </Button>
          }
        />
      );
    }
    return (
      <EmptyState
        icon={<Users />}
        title="Aún no tienes leads"
        description="Crea el primero o conecta tus campañas para que entren solos."
        action={<Button onClick={onCreateLead}>Crear primer lead</Button>}
      />
    );
  }

  return <TimelineList data={data} now={now} isRefetching={isRefetching} />;
}

/**
 * Renderizador interno — separa la lógica de virtualización del wrapper.
 */
function TimelineList({
  data,
  now,
  isRefetching,
}: Pick<LeadsTimelineViewProps, "data" | "now" | "isRefetching">) {
  const router = useRouter();
  const groups = useMemo(() => groupLeadsByMonth(data), [data]);

  const flatItems = useMemo<FlatItem[]>(() => {
    const items: FlatItem[] = [];
    for (const group of groups) {
      items.push({ kind: "header", group, key: `h-${group.monthKey}` });
      for (const lead of group.leads) {
        items.push({ kind: "lead", lead, key: `l-${lead.id}` });
      }
    }
    return items;
  }, [groups]);

  const parentRef = useRef<HTMLDivElement>(null);
  const enableVirtual = data.length > VIRTUALIZE_THRESHOLD;

  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (flatItems[index]?.kind === "header" ? 44 : 84),
    overscan: 8,
    enabled: enableVirtual,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop =
    enableVirtual && virtualItems.length > 0 ? virtualItems[0]!.start : 0;
  const paddingBottom =
    enableVirtual && virtualItems.length > 0
      ? totalSize - virtualItems[virtualItems.length - 1]!.end
      : 0;

  const itemsToRender = enableVirtual
    ? virtualItems.map((vi) => ({ index: vi.index, item: flatItems[vi.index]! }))
    : flatItems.map((item, index) => ({ index, item }));

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-border bg-surface",
        isRefetching && "opacity-90",
      )}
    >
      {isRefetching ? (
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 h-0.5 animate-pulse bg-brand/70"
          aria-hidden
        />
      ) : null}
      <div
        ref={parentRef}
        className="max-h-[calc(100vh-18rem)] overflow-auto"
        role="feed"
        aria-label="Línea de tiempo de leads"
      >
        {paddingTop > 0 ? (
          <div aria-hidden style={{ height: paddingTop }} />
        ) : null}
        <ul className="m-0 p-0">
          {itemsToRender.map(({ item }) => {
            if (item.kind === "header") {
              return (
                <TimelineMonthHeader
                  key={item.key}
                  label={item.group.label}
                  count={item.group.leads.length}
                />
              );
            }
            return (
              <TimelineLeadCard
                key={item.key}
                lead={item.lead}
                onClick={() => router.push(`/leads/${item.lead.id}`)}
                now={now}
              />
            );
          })}
        </ul>
        {paddingBottom > 0 ? (
          <div aria-hidden style={{ height: paddingBottom }} />
        ) : null}
      </div>
    </div>
  );
}
