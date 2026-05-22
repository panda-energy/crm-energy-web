"use client";

import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useDefaultPipelineId } from "@/lib/api/hooks/use-auth";
import { useLeads, leadsQueryKeys } from "@/lib/api/hooks/use-leads";
import { usePipelines, usePipelineStages } from "@/lib/api/hooks/use-pipelines";
import { useLeadsSearchParams } from "@/lib/leads/use-leads-search-params";
import { useLeadsUiStore } from "@/lib/leads/leads-ui-store";
import type { PipelineStage } from "@/lib/api/hooks/use-pipelines";
import { LeadsFiltersSidebar } from "@/components/leads/leads-filters-sidebar";
import { LeadsPagination } from "@/components/leads/leads-pagination";
import { LeadsTable } from "@/components/leads/leads-table";
import { BulkActionBar } from "@/components/leads/bulk-action-bar";
import { CreateLeadSheet } from "@/components/leads/create-lead-sheet";
import { LeadDetailSheet } from "@/components/leads/lead-detail-sheet";

/**
 * Cliente principal de la página `/leads` (F-2.1).
 *
 * Responsabilidades:
 *  1. Leer filtros de URL via `useLeadsSearchParams`.
 *  2. Disparar `useLeads(params)` con `placeholderData: keepPreviousData`.
 *  3. Componer header + sidebar de filtros + tabla virtualizada + paginación.
 *  4. Montar el `CreateLeadSheet` (F-2.10) controlado.
 *  5. Si `detailLeadId` viene del segmento dinámico `/leads/[leadId]`, montar
 *     el `LeadDetailSheet` (F-2.4) por encima.
 *
 * NO toca:
 *  - El layout autenticado (sidebar + topbar) — eso lo hereda.
 *  - El routing — solo provee callbacks.
 */
export interface LeadsPageClientProps {
  /** Si está presente, el Sheet de detalle se abre automáticamente. */
  detailLeadId?: string;
}

const DEFAULT_LIMIT = 25;

export function LeadsPageClient({ detailLeadId }: LeadsPageClientProps) {
  const { params, hasActiveFilters, updateFilters, clearFilters } =
    useLeadsSearchParams();
  const [createOpen, setCreateOpen] = useState(false);

  // Sync ?createLead=1 → abre el Sheet (lo dispara cmd-k "Crear lead").
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("createLead") === "1") {
      setCreateOpen(true);
      // Limpia el flag para que un refresh no reabra el sheet.
      const sp = new URLSearchParams(searchParams.toString());
      sp.delete("createLead");
      router.replace(`/leads${sp.size ? `?${sp.toString()}` : ""}`, {
        scroll: false,
      });
    }
  }, [searchParams, router]);

  const queryClient = useQueryClient();

  // Paginación con defaults seguros si el URL no los trae.
  const limit = params.limit ?? DEFAULT_LIMIT;
  const offset = params.offset ?? 0;

  const leadsQuery = useLeads(
    { ...params, limit, offset },
    // reason: TanStack Query v5 acepta `placeholderData: keepPreviousData`
    // como segundo argumento solo en hooks que lo permitan. Lo metemos en el
    // wrapper porque la API extendida no soporta override directo — usamos
    // el queryClient para configurar via setQueryDefaults. Aquí lo hacemos
    // localmente en el hook si está soportado.
  );

  // reason: `useLeads` no acepta directamente `placeholderData` (la firma del
  // wrapper actual no lo expone). Mientras tanto, configuramos el default a
  // nivel de queryClient para esta key: mantiene la página anterior visible
  // durante refetches de filtros (anti-pattern: blanquear la tabla).
  useMemo(() => {
    queryClient.setQueryDefaults(leadsQueryKeys.all, {
      placeholderData: keepPreviousData,
      // reason: 30s de fresco para que cambiar entre /leads ↔ /leads/X y
      // volver no dispare refetch innecesario.
      staleTime: 30_000,
    });
  }, [queryClient]);

  const pipelinesQuery = usePipelines();
  // reason (cleanup wave): preferimos `useAuthMe().default_pipeline_id`
  // como fuente de verdad — viene del backend directamente y evita el
  // race en el que `pipelinesQuery` resuelve antes que el form que el
  // user abrió. Caemos al primer pipeline disponible solo si /auth/me aún
  // no resolvió.
  const meDefaultPipelineId = useDefaultPipelineId();
  const defaultPipelineId =
    meDefaultPipelineId ??
    pipelinesQuery.data?.find((p) => p.is_default)?.id ??
    pipelinesQuery.data?.[0]?.id;
  const stagesQuery = usePipelineStages(defaultPipelineId);

  // Map para resolver `stage_id` → stage name en la tabla.
  const stagesById = useMemo<Map<string, PipelineStage>>(() => {
    const m = new Map<string, PipelineStage>();
    for (const stage of stagesQuery.data ?? []) m.set(stage.id, stage);
    return m;
  }, [stagesQuery.data]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    for (const lead of leadsQuery.data?.items ?? []) {
      for (const tag of lead.tags) set.add(tag);
    }
    return Array.from(set).sort();
  }, [leadsQuery.data]);

  const isFirstLoad = leadsQuery.isLoading;
  const total = leadsQuery.data?.total ?? 0;
  const items = useMemo(() => leadsQuery.data?.items ?? [], [leadsQuery.data]);
  const visibleLeadIds = useMemo(() => items.map((l) => l.id), [items]);

  // reason: la selección bulk se limpia al desmontar el cliente — i.e. al
  // navegar fuera de /leads (o al recargar). Mantenerla cross-route sería
  // confuso (¿qué se elimina si pulso bulk-delete desde otra vista?). En
  // cambio SE PRESERVA cross-filter dentro de /leads (el indicador "{M}
  // no visibles" lo comunica).
  const clearSelectionOnUnmount = useLeadsUiStore((s) => s.clearSelection);
  useEffect(() => () => clearSelectionOnUnmount(), [clearSelectionOnUnmount]);

  return (
    <div className="-m-4 flex flex-1 md:-m-8">
      <LeadsFiltersSidebar
        params={params}
        updateFilters={updateFilters}
        clearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        availableTags={availableTags}
      />

      <section className="flex min-w-0 flex-1 flex-col gap-4 px-4 py-6 md:px-8 md:py-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Leads
            </h1>
            <p className="text-sm text-muted-foreground">
              {leadsQuery.isLoading
                ? "Cargando…"
                : `${total.toLocaleString("es-ES")} ${total === 1 ? "lead" : "leads"} ${hasActiveFilters ? "filtrados" : "totales"}`}
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Crear lead
          </Button>
        </header>

        {isFirstLoad ? (
          <TableSkeleton rows={8} cols={8} />
        ) : leadsQuery.isError ? (
          <EmptyState
            icon={<Users />}
            title="No pudimos cargar los leads"
            description={
              leadsQuery.error?.message ??
              "Algo falló al hablar con el servidor. Reintenta en unos segundos."
            }
            action={
              <Button onClick={() => leadsQuery.refetch()}>Reintentar</Button>
            }
          />
        ) : total === 0 && hasActiveFilters ? (
          <EmptyState
            icon={<Users />}
            title="Sin resultados con estos filtros"
            description="Prueba a quitar alguno o cambiar el rango de fechas."
            action={
              <Button variant="outline" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            }
          />
        ) : total === 0 ? (
          <EmptyState
            icon={<Users />}
            title="Aún no tienes leads"
            description="Crea el primero o conecta tus campañas para que entren solos."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" aria-hidden />
                Crear primer lead
              </Button>
            }
          />
        ) : (
          <div className="flex flex-1 flex-col">
            <LeadsTable
              data={items}
              stagesById={stagesById}
              sort={params.sort}
              direction={params.direction}
              onSortChange={updateFilters}
              isRefetching={leadsQuery.isFetching && !leadsQuery.isLoading}
            />
            <LeadsPagination
              total={total}
              limit={limit}
              offset={offset}
              onChange={updateFilters}
            />
          </div>
        )}
      </section>

      <CreateLeadSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultPipelineId={defaultPipelineId}
      />

      {detailLeadId ? <LeadDetailSheet leadId={detailLeadId} /> : null}

      {/* Barra flotante bulk — solo aparece si hay leads seleccionados. */}
      <BulkActionBar visibleLeadIds={visibleLeadIds} />
    </div>
  );
}
