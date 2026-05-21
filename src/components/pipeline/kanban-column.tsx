"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useVirtualizer } from "@tanstack/react-virtual";
import Link from "next/link";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils/cn";
import type { Lead } from "@/lib/api/hooks/use-leads";
import type { PipelineStage } from "@/lib/api/hooks/use-pipelines";
import { makeStageDroppableId } from "@/lib/kanban/dnd-helpers";
import { KanbanCard } from "./kanban-card";

/**
 * Columna Kanban — header + lista virtualizada de cards + footer "+N más".
 *
 * Decisiones:
 *  - Una llamada `useLeads({ pipeline_id, stage_id, limit })` por columna
 *    (caller). Caller pasa `leads`, `total`, `isLoading`, `pipelineId`.
 *  - Virtualización activa solo si >50 cards en una columna.
 *  - `useDroppable` para que la columna acepte drops aunque esté vacía
 *    (en cuyo caso `SortableContext` no resolvería).
 */
export interface KanbanColumnProps {
  stage: PipelineStage;
  leads: ReadonlyArray<Lead>;
  total: number;
  limit: number;
  pipelineId: string;
  isLoading?: boolean;
  /** Set de `lead.id` con mutación move en vuelo. */
  movingLeadIds?: ReadonlySet<string>;
}

export function KanbanColumn({
  stage,
  leads,
  total,
  limit,
  pipelineId,
  isLoading,
  movingLeadIds,
}: KanbanColumnProps) {
  const droppableId = makeStageDroppableId(stage.id);
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  const scrollRef = useRef<HTMLDivElement>(null);
  const enableVirtual = leads.length > 50;
  const virtualizer = useVirtualizer({
    count: leads.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 108,
    overscan: 6,
    enabled: enableVirtual,
  });

  const stageBadgeVariant = stage.is_won
    ? "success"
    : stage.is_lost
      ? "destructive"
      : "outline";

  const hasMore = total > leads.length;

  return (
    <div
      className={cn(
        "flex h-full w-72 shrink-0 flex-col rounded-lg border border-border bg-muted/30",
        "transition-colors",
      )}
    >
      <header className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className={cn(
              "size-2 shrink-0 rounded-full",
              stage.is_won
                ? "bg-success"
                : stage.is_lost
                  ? "bg-danger"
                  : "bg-muted-foreground/40",
            )}
          />
          <h3 className="truncate text-sm font-semibold text-foreground">
            {stage.name}
          </h3>
        </div>
        <Badge variant={stageBadgeVariant} className="text-[10px]">
          {total.toLocaleString("es-ES")}
        </Badge>
      </header>

      <div
        ref={(node) => {
          setNodeRef(node);
          scrollRef.current = node;
        }}
        data-drop-target={isOver || undefined}
        className={cn(
          "flex-1 overflow-y-auto p-2 transition-colors",
          isOver && "bg-brand/5 ring-2 ring-inset ring-brand/30",
        )}
        aria-label={`Columna ${stage.name}, ${total} leads`}
      >
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-md" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            title="Sin leads"
            description="Arrastra aquí para mover."
            className="bg-transparent py-6 text-xs"
          />
        ) : (
          <SortableContext
            items={leads.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            {enableVirtual ? (
              <div
                style={{ height: virtualizer.getTotalSize(), position: "relative" }}
              >
                {virtualizer.getVirtualItems().map((vi) => {
                  const lead = leads[vi.index]!;
                  return (
                    <div
                      key={lead.id}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        transform: `translateY(${vi.start}px)`,
                        padding: "0 0 0.5rem 0",
                      }}
                    >
                      <KanbanCard
                        lead={lead}
                        isMoving={movingLeadIds?.has(lead.id)}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {leads.map((lead) => (
                  <KanbanCard
                    key={lead.id}
                    lead={lead}
                    isMoving={movingLeadIds?.has(lead.id)}
                  />
                ))}
              </div>
            )}
          </SortableContext>
        )}
      </div>

      {hasMore ? (
        <footer className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
          <span>
            {leads.length} de {total.toLocaleString("es-ES")} (limit {limit})
          </span>
          <Link
            href={`/leads?pipeline_id=${pipelineId}&stage_id=${stage.id}`}
            className="font-medium text-brand hover:underline focus-visible:outline-none focus-visible:underline"
          >
            Ver todos
          </Link>
        </footer>
      ) : null}
    </div>
  );
}
