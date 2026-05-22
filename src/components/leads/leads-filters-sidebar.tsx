"use client";

import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LEAD_SOURCE_LABELS,
  LEAD_SOURCE_ORDER,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_ORDER,
} from "@/lib/leads/format";
import { usePipelines, usePipelineStages } from "@/lib/api/hooks/use-pipelines";
import { useLeadsUiStore } from "@/lib/leads/leads-ui-store";
import {
  type LeadSource,
  type LeadStatus,
  type LeadsFiltersInput,
} from "@/lib/leads/use-leads-search-params";
import type { UseLeadsParams } from "@/lib/api/hooks/use-leads";
import { cn } from "@/lib/utils/cn";
import { MultiSelectFilter } from "./multi-select-filter";
import { LeadStatusBadge } from "./lead-status-badge";
import { UsersMultiSelect } from "./users-multi-select";

/**
 * Sidebar de filtros para `/leads` (F-2.1).
 *
 * Datos:
 *  - Filtros vivos en URL; este componente recibe `params` y dispara
 *    `updateFilters` / `clearFilters` desde el caller (no toca router
 *    directamente — facilita testing).
 *  - `q` se debounce-a 300ms (anti-pattern: fetch en cada keystroke).
 *  - Tags se construyen a partir de los visibles en pantalla + permite
 *    añadir manual (tag-free-text).
 *
 * Owners (cleanup wave):
 *  - `UsersMultiSelect` consume `GET /v1/users` con debounce. Reemplaza
 *    al placeholder vacío + input UUID plano de Sprint 2 inicial.
 */
export interface LeadsFiltersSidebarProps {
  params: UseLeadsParams;
  updateFilters: (patch: LeadsFiltersInput) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  /** Tags visibles en la página actual (consolidados desde los leads). */
  availableTags: ReadonlyArray<string>;
}

const STATUS_OPTIONS = LEAD_STATUS_ORDER.map((status) => ({
  value: status,
  label: LEAD_STATUS_LABELS[status],
  hint: <LeadStatusBadge status={status} className="px-1.5 py-0 text-[10px]" />,
}));

const SOURCE_OPTIONS = LEAD_SOURCE_ORDER.map((source) => ({
  value: source,
  label: LEAD_SOURCE_LABELS[source],
}));

export function LeadsFiltersSidebar({
  params,
  updateFilters,
  clearFilters,
  hasActiveFilters,
  availableTags,
}: LeadsFiltersSidebarProps) {
  const collapsed = useLeadsUiStore((s) => s.filtersCollapsed);
  const toggleFilters = useLeadsUiStore((s) => s.toggleFilters);

  // ── Debounce de búsqueda ─────────────────────────────────────────────────
  const [searchDraft, setSearchDraft] = useState(params.q ?? "");
  useEffect(() => {
    // Si el URL cambia desde fuera (back/forward), sincroniza el input.
    setSearchDraft(params.q ?? "");
  }, [params.q]);
  useEffect(() => {
    const id = setTimeout(() => {
      if ((params.q ?? "") !== searchDraft) {
        updateFilters({ q: searchDraft.trim() || undefined });
      }
    }, 300);
    return () => clearTimeout(id);
    // reason: queremos disparar el efecto solo cuando cambia el draft, no
    // cuando cambia `params.q` (eso lo gestiona el efecto anterior).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  // ── Pipelines y stages para los selects ──────────────────────────────────
  const pipelinesQuery = usePipelines();
  const selectedPipelineIds = params.pipeline_id ?? [];
  // Stages se filtran por el primer pipeline seleccionado (UX simple para MVP;
  // multi-pipeline stages cuando entre la UI de gestión de pipelines).
  const firstPipelineId = selectedPipelineIds[0];
  const stagesQuery = usePipelineStages(firstPipelineId);

  const pipelineOptions = useMemo(
    () =>
      (pipelinesQuery.data ?? []).map((p) => ({
        value: p.id,
        label: p.name,
      })),
    [pipelinesQuery.data],
  );

  const stageOptions = useMemo(
    () =>
      (stagesQuery.data ?? []).map((s) => ({
        value: s.id,
        label: s.name,
      })),
    [stagesQuery.data],
  );

  // ── Tags chip-add ────────────────────────────────────────────────────────
  // reason: estabilizamos `selectedTags` con useMemo porque su identidad
  // entra en deps de otros hooks; sin esto ESLint avisa de re-creación en
  // cada render.
  const selectedTags = useMemo(() => params.tag ?? [], [params.tag]);
  const [tagDraft, setTagDraft] = useState("");
  const allTagOptions = useMemo(() => {
    const set = new Set<string>([...availableTags, ...selectedTags]);
    return Array.from(set)
      .sort()
      .map((t) => ({ value: t, label: t }));
  }, [availableTags, selectedTags]);

  const addTag = useCallback(
    (raw: string) => {
      const tag = raw.trim();
      if (!tag) return;
      if (selectedTags.includes(tag)) {
        setTagDraft("");
        return;
      }
      updateFilters({ tag: [...selectedTags, tag] });
      setTagDraft("");
    },
    [selectedTags, updateFilters],
  );

  // ── Owners (cleanup wave: useUsers + UsersMultiSelect) ───────────────────
  const ownerIds = params.owner_id ?? [];

  if (collapsed) {
    return (
      <aside
        className={cn(
          "hidden md:flex",
          "sticky top-14 h-[calc(100vh-3.5rem)] shrink-0",
          "w-10 flex-col items-center border-r border-border bg-surface/50 py-3",
        )}
        aria-label="Filtros (colapsado)"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFilters}
          aria-label="Expandir filtros"
          className="size-8"
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "hidden md:flex",
        "sticky top-14 h-[calc(100vh-3.5rem)] shrink-0",
        "w-72 flex-col border-r border-border bg-surface/30",
      )}
      aria-label="Filtros"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Filtros</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFilters}
          aria-label="Colapsar filtros"
          className="size-7"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {/* Búsqueda */}
        <div className="space-y-1.5">
          <Label htmlFor="leads-search" className="text-xs uppercase tracking-wide text-muted-foreground">
            Buscar
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="leads-search"
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Nombre, email, teléfono…"
              className="pl-8"
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Estado
          </Label>
          <MultiSelectFilter<LeadStatus>
            label="Todos los estados"
            options={STATUS_OPTIONS}
            selected={(params.statuses ?? []) as LeadStatus[]}
            onChange={(next) => updateFilters({ statuses: next })}
          />
        </div>

        {/* Source */}
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Origen
          </Label>
          <MultiSelectFilter<LeadSource>
            label="Todos los orígenes"
            options={SOURCE_OPTIONS}
            selected={(params.sources ?? []) as LeadSource[]}
            onChange={(next) => updateFilters({ sources: next })}
          />
        </div>

        {/* Owner — UsersMultiSelect con búsqueda contra /v1/users */}
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Propietario
          </Label>
          <UsersMultiSelect
            selected={ownerIds}
            onChange={(next) => updateFilters({ owner_id: next })}
          />
        </div>

        {/* Pipeline */}
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Pipeline
          </Label>
          <MultiSelectFilter
            label={pipelinesQuery.isLoading ? "Cargando…" : "Todos los pipelines"}
            options={pipelineOptions}
            selected={params.pipeline_id ?? []}
            onChange={(next) =>
              updateFilters({
                pipeline_id: next,
                // Si quitas la pipeline, también limpia stages asociadas.
                stage_id: next.length === 0 ? [] : params.stage_id,
              })
            }
          />
        </div>

        {/* Stage */}
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Etapa
          </Label>
          <MultiSelectFilter
            label={
              !firstPipelineId
                ? "Selecciona un pipeline"
                : stagesQuery.isLoading
                  ? "Cargando…"
                  : "Todas las etapas"
            }
            options={stageOptions}
            selected={params.stage_id ?? []}
            onChange={(next) => updateFilters({ stage_id: next })}
            disabled={!firstPipelineId}
            disabledHint="Selecciona un pipeline primero"
          />
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <Label
            htmlFor="leads-tags-input"
            className="text-xs uppercase tracking-wide text-muted-foreground"
          >
            Etiquetas
          </Label>
          <MultiSelectFilter
            label="Etiquetas visibles"
            options={allTagOptions}
            selected={selectedTags}
            onChange={(next) => updateFilters({ tag: next })}
            emptyText="No hay etiquetas en los resultados actuales."
          />
          <div className="flex gap-1">
            <Input
              id="leads-tags-input"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(tagDraft);
                }
              }}
              placeholder="Añadir etiqueta + Enter"
              className="h-8 text-xs"
              aria-label="Añadir etiqueta personalizada"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => addTag(tagDraft)}
            >
              Añadir
            </Button>
          </div>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="leads-date-from"
              className="text-xs uppercase tracking-wide text-muted-foreground"
            >
              Desde
            </Label>
            <Input
              id="leads-date-from"
              type="date"
              value={params.created_from?.slice(0, 10) ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                updateFilters({
                  created_from: v ? `${v}T00:00:00Z` : undefined,
                });
              }}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="leads-date-to"
              className="text-xs uppercase tracking-wide text-muted-foreground"
            >
              Hasta
            </Label>
            <Input
              id="leads-date-to"
              type="date"
              value={params.created_to?.slice(0, 10) ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                updateFilters({
                  created_to: v ? `${v}T23:59:59Z` : undefined,
                });
              }}
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="border-t border-border p-3">
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="w-full"
          >
            <X className="size-3.5" aria-hidden />
            Limpiar filtros
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
