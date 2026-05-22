"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/ui/toast";
import { apiGet, apiPost } from "@/lib/api/client";
import { useClerkApiContext } from "@/lib/api/hooks/clerk-context";
import {
  leadsQueryKeys,
  type Lead,
  type LeadPage,
} from "@/lib/api/hooks/use-leads";
import { usePipelines, usePipelineStages } from "@/lib/api/hooks/use-pipelines";
import { LeadPageSchema } from "@/lib/api/zod-schemas";
import {
  applyOptimisticMoveToPage,
  computeDropPosition,
  parseDropEvent,
} from "@/lib/kanban/dnd-helpers";
import { KanbanCard } from "./kanban-card";
import { KanbanColumn } from "./kanban-column";
import { KanbanSkeleton } from "./kanban-skeleton";

/**
 * Cliente principal de `/pipeline` (F-2.2).
 *
 * Estructura:
 *  - Lee `pipelineId` de la URL (`?pipelineId=…`). Si no viene, usa el
 *    default del tenant.
 *  - `usePipelineStages(pipelineId)` ordena las columnas por `position`.
 *  - Una `useLeads` por columna (limit 50) usando `useQueries` para
 *    paralelizarlas. Decisión razonable para MVP.
 *  - `DndContext` global con sensores Mouse + Touch + Keyboard.
 *  - Drop → POST /v1/leads/{id}/move optimistic. Coordinamos revert de
 *    las páginas de DOS columnas a la vez (origen + destino), por eso la
 *    mutación se hace inline (no usamos `useMoveLead`).
 *
 * Cleanup wave:
 *  - **`position` explícito** en el payload `LeadMove`: lo calculamos con
 *    `computeDropPosition` a partir del índice del drop. `null` = al final.
 *  - **`entry_criteria` por stage**: si el stage destino define criterios,
 *    los enseñamos en un toast warning antes del optimistic. El drop sigue
 *    adelante porque la evaluación real del DSL (cuándo se cumplen) la
 *    hará Sprint 3 (motor de auto-stage); aquí solo informamos.
 *
 * Deuda anotada (no es bug del cleanup):
 *  - Una query por columna multiplica round-trips. Alternativa: una sola
 *    `useLeads({ pipeline_id })` con limit alto + groupBy cliente. Decidir
 *    cuando midamos en staging.
 */
const COLUMN_LIMIT = 50;

export function PipelinePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken, tenantId } = useClerkApiContext();
  const queryClient = useQueryClient();

  const pipelinesQuery = usePipelines();
  const pipelines = pipelinesQuery.data ?? [];

  const urlPipelineId = searchParams.get("pipelineId");
  const defaultPipelineId =
    pipelines.find((p) => p.is_default)?.id ?? pipelines[0]?.id;
  const pipelineId = urlPipelineId ?? defaultPipelineId;

  const stagesQuery = usePipelineStages(pipelineId);
  const stages = useMemo(
    () => [...(stagesQuery.data ?? [])].sort((a, b) => a.position - b.position),
    [stagesQuery.data],
  );

  // Una `useLeads` por columna en paralelo.
  const columnQueries = useQueries({
    queries: stages.map((stage) => ({
      queryKey: leadsQueryKeys.list({
        pipeline_id: pipelineId ? [pipelineId] : undefined,
        stage_id: [stage.id],
        limit: COLUMN_LIMIT,
      }),
      queryFn: async (): Promise<LeadPage> => {
        // reason: el cliente `apiGet` con `query` usa `set` que no soporta
        // arrays. Construimos la URL absoluta con `URLSearchParams` y la
        // pasamos como path (el cliente concatena base + path).
        const sp = new URLSearchParams();
        if (pipelineId) sp.append("pipeline_id", pipelineId);
        sp.append("stage_id", stage.id);
        sp.append("limit", String(COLUMN_LIMIT));
        const response = await apiGet<unknown>(
          `/v1/leads?${sp.toString()}`,
          { getToken, tenantId },
        );
        return LeadPageSchema.parse(response);
      },
      enabled: Boolean(pipelineId && stage.id),
      staleTime: 30_000,
    })),
  });

  // Mapa lead.id → stage.id, consolidado a partir de las páginas cargadas.
  // Se usa para `parseDropEvent` al resolver `over.id` de una card.
  const leadStageById = useMemo(() => {
    const m = new Map<string, string>();
    for (const q of columnQueries) {
      const page = q.data;
      if (!page) continue;
      for (const lead of page.items) m.set(lead.id, lead.stage_id);
    }
    return m;
  }, [columnQueries]);

  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [movingLeadIds, setMovingLeadIds] = useState<ReadonlySet<string>>(
    new Set(),
  );

  // Sensores: mouse + touch + teclado (a11y).
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const lead = (event.active.data.current?.lead as Lead | undefined) ?? null;
    setActiveLead(lead);
  };

  const handleDragCancel = () => setActiveLead(null);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveLead(null);
      const { active, over } = event;
      if (!over || !pipelineId) return;

      const parsed = parseDropEvent({
        activeId: String(active.id),
        overId: String(over.id),
        leadStageById,
      });
      if (!parsed) return;

      const { leadId, fromStageId, toStageId, overCardId } = parsed;

      // Calcular position desde el índice de drop (cleanup wave).
      // Filtramos el lead arrastrado del array destino para que el índice
      // post-drop sea consistente con el resto del stage.
      const destinationStageIdx = stages.findIndex((s) => s.id === toStageId);
      const destinationCards =
        columnQueries[destinationStageIdx]?.data?.items.filter(
          (l) => l.id !== leadId,
        ) ?? [];
      const position = computeDropPosition(destinationCards, overCardId);

      // Entry criteria warning — si el stage destino los declara, mostramos
      // un toast informativo. NO bloqueamos el drop (la validación real
      // pertenece al motor de auto-stage del backend Sprint 3).
      const targetStage = stages.find((s) => s.id === toStageId);
      const criteria = targetStage?.entry_criteria;
      if (
        targetStage &&
        Array.isArray(criteria) &&
        criteria.length > 0
      ) {
        toast.warning(
          `La etapa "${targetStage.name}" tiene criterios de entrada`,
          {
            description:
              "Revisa que el lead los cumpla. La validación automática llega en Sprint 3.",
            duration: 4000,
          },
        );
      }

      // Snapshot de todas las páginas afectadas (lista global + por stage).
      const pageQueries = queryClient.getQueriesData<LeadPage>({
        queryKey: leadsQueryKeys.all,
      });
      const snapshots: Array<[readonly unknown[], LeadPage]> = [];
      for (const [key, data] of pageQueries) {
        if (data) snapshots.push([key, data]);
      }

      // Optimistic: aplicamos el move en todas las páginas que contengan
      // el lead. Para queries que filtran por stage_id, ajustamos
      // pertenencia (entra/sale de la página).
      for (const [key, data] of pageQueries) {
        if (!data) continue;
        const filtersAny = (key as readonly unknown[])[1] as
          | { stage_id?: string[] }
          | undefined;
        const filterStages = filtersAny?.stage_id;
        const next = applyOptimisticMoveToPage(data, leadId, toStageId);
        if (filterStages?.length) {
          const filterMatches = (s: string) => filterStages.includes(s);
          const wasIncluded = filterMatches(fromStageId);
          const stillIncluded = filterMatches(toStageId);
          if (wasIncluded && !stillIncluded) {
            // El lead salió de esta query: quitarlo y bajar total.
            queryClient.setQueryData<LeadPage>(key, {
              ...next,
              items: next.items.filter((l) => l.id !== leadId),
              total: Math.max(0, data.total - 1),
            });
            continue;
          }
          if (!wasIncluded && stillIncluded) {
            // El lead entró: no podemos insertarlo (no tenemos su shape
            // completo aquí); invalidaremos al recibir respuesta del backend.
            queryClient.setQueryData<LeadPage>(key, next);
            continue;
          }
        }
        queryClient.setQueryData<LeadPage>(key, next);
      }

      setMovingLeadIds((prev) => {
        const set = new Set(prev);
        set.add(leadId);
        return set;
      });

      try {
        await apiPost<Lead>(
          `/v1/leads/{lead_id}/move`,
          // reason: `position` opcional — `null` o ausencia significan
          // "al final" en el backend. Lo enviamos solo cuando computeDropPosition
          // devolvió un índice válido (drop entre dos cards o al principio).
          position !== null
            ? { stage_id: toStageId, position }
            : { stage_id: toStageId },
          {
            getToken,
            tenantId,
            pathParams: { lead_id: leadId },
            idempotencyKey: crypto.randomUUID(),
          },
        );
        queryClient.invalidateQueries({ queryKey: leadsQueryKeys.all });
        queryClient.invalidateQueries({
          queryKey: leadsQueryKeys.detail(leadId),
        });
        queryClient.invalidateQueries({
          queryKey: leadsQueryKeys.activities(leadId),
        });
      } catch (err) {
        // Revert a snapshots.
        for (const [key, snapshot] of snapshots) {
          queryClient.setQueryData(key, snapshot);
        }
        toast.error("No se pudo mover el lead", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setMovingLeadIds((prev) => {
          const set = new Set(prev);
          set.delete(leadId);
          return set;
        });
      }
    },
    [
      columnQueries,
      getToken,
      leadStageById,
      pipelineId,
      queryClient,
      stages,
      tenantId,
    ],
  );

  // ── UI ────────────────────────────────────────────────────────────────────

  if (pipelinesQuery.isLoading) {
    return <KanbanSkeleton />;
  }

  if (pipelinesQuery.isError) {
    return (
      <EmptyState
        icon={<BarChart3 />}
        title="No pudimos cargar el pipeline"
        description={pipelinesQuery.error?.message ?? "Reintenta en unos segundos."}
        action={<Button onClick={() => pipelinesQuery.refetch()}>Reintentar</Button>}
      />
    );
  }

  if (!pipelineId || pipelines.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 />}
        title="No hay pipelines"
        description="Tu tenant todavía no tiene una pipeline configurada."
      />
    );
  }

  const onPipelineChange = (next: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("pipelineId", next);
    router.replace(`/pipeline?${sp.toString()}`, { scroll: false });
  };

  const showPipelineSelector = pipelines.length > 1;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Pipeline
          </h1>
          <p className="text-sm text-muted-foreground">
            Arrastra leads entre etapas para actualizar su estado.
          </p>
        </div>
        {showPipelineSelector ? (
          <div className="flex items-center gap-2">
            <label
              htmlFor="pipeline-selector"
              className="text-xs font-medium text-muted-foreground"
            >
              Pipeline
            </label>
            <Select value={pipelineId} onValueChange={onPipelineChange}>
              <SelectTrigger
                id="pipeline-selector"
                className="h-9 w-56 text-sm"
                aria-label="Seleccionar pipeline"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.is_default ? " (por defecto)" : null}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </header>

      {stagesQuery.isLoading ? (
        <KanbanSkeleton />
      ) : stages.length === 0 ? (
        <EmptyState
          icon={<BarChart3 />}
          title="Pipeline sin etapas"
          description="Configura al menos una etapa para empezar a usar el Kanban."
          action={
            <Button disabled title="Próximamente — requiere useReplacePipelineStages">
              Configurar stages
            </Button>
          }
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragCancel={handleDragCancel}
          onDragEnd={handleDragEnd}
          accessibility={{
            announcements: {
              onDragStart({ active }) {
                return `Lead ${String(active.id).slice(0, 8)} agarrado. Usa flechas para moverlo entre columnas.`;
              },
              onDragOver({ active, over }) {
                if (!over) return undefined;
                return `Lead ${String(active.id).slice(0, 8)} sobre ${String(over.id).slice(0, 8)}.`;
              },
              onDragEnd({ active, over }) {
                if (!over) {
                  return `Lead ${String(active.id).slice(0, 8)} soltado fuera de columna.`;
                }
                return `Lead ${String(active.id).slice(0, 8)} movido.`;
              },
              onDragCancel({ active }) {
                return `Movimiento de lead ${String(active.id).slice(0, 8)} cancelado.`;
              },
            },
          }}
        >
          <div
            className="flex flex-1 gap-3 overflow-x-auto pb-2"
            role="region"
            aria-label="Pipeline Kanban"
          >
            {stages.map((stage, idx) => {
              const q = columnQueries[idx];
              const page = q?.data;
              return (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  leads={page?.items ?? []}
                  total={page?.total ?? 0}
                  limit={COLUMN_LIMIT}
                  pipelineId={pipelineId}
                  isLoading={q?.isLoading}
                  movingLeadIds={movingLeadIds}
                />
              );
            })}
          </div>
          <DragOverlay>
            {activeLead ? <KanbanCard lead={activeLead} isDragOverlay /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
