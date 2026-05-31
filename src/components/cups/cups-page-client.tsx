"use client";

import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useCups, cupsQueryKeys, type Cups } from "@/lib/api/hooks/use-cups";
import { toast } from "@/lib/ui/toast";
import { CupsTable } from "./cups-table";
import { CreateCupsDialog } from "./create-cups-dialog";
import { CupsDetailSheet } from "./cups-detail-sheet";

/**
 * Client component for /cups page (F-3.1).
 *
 * Features:
 *  - Paginated table with search by CUPS code / address / distributor
 *  - Create CUPS modal
 *  - SIPS query per row
 *  - Detail sheet on row click
 */

const DEFAULT_LIMIT = 25;

export interface CupsPageClientProps {
  /** If set, opens the detail sheet automatically (from /cups/[id]). */
  detailCupsId?: string;
}

export function CupsPageClient({ detailCupsId }: CupsPageClientProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCupsId, setSelectedCupsId] = useState<string | null>(
    detailCupsId ?? null,
  );
  const [offset, setOffset] = useState(0);

  const queryClient = useQueryClient();

  // Debounce search 300ms
  const searchTimeout = useMemo(() => ({ current: null as ReturnType<typeof setTimeout> | null }), []);
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        setDebouncedSearch(value);
        setOffset(0);
      }, 300);
    },
    [searchTimeout],
  );

  const cupsQuery = useCups({
    q: debouncedSearch || undefined,
    limit: DEFAULT_LIMIT,
    offset,
  });

  // Configure keepPreviousData for smooth filter transitions
  useEffect(() => {
    queryClient.setQueryDefaults(cupsQueryKeys.all, {
      placeholderData: keepPreviousData,
      staleTime: 30_000,
    });
  }, [queryClient]);

  const items = useMemo(() => cupsQuery.data?.items ?? [], [cupsQuery.data]);
  const total = cupsQuery.data?.total ?? 0;

  const handleSipsQuery = useCallback(
    (cups: Cups) => {
      toast.info(`Consultando SIPS para ${cups.code}...`);
      // Trigger a refetch of the SIPS data — the detail sheet shows it
      void queryClient.invalidateQueries({
        queryKey: cupsQueryKeys.detail(cups.id),
      });
      setSelectedCupsId(cups.id);
    },
    [queryClient],
  );

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            CUPS
          </h1>
          <p className="text-sm text-muted-foreground">
            {cupsQuery.isLoading
              ? "Cargando..."
              : `${total.toLocaleString("es-ES")} ${total === 1 ? "punto de suministro" : "puntos de suministro"}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden />
            <Input
              placeholder="Buscar CUPS, dirección..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-64 pl-9"
              aria-label="Buscar CUPS"
            />
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Nuevo CUPS
          </Button>
        </div>
      </header>

      {cupsQuery.isLoading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : cupsQuery.isError ? (
        <EmptyState
          icon={<MapPin />}
          title="No pudimos cargar los CUPS"
          description={cupsQuery.error?.message ?? "Error al conectar con el servidor."}
          action={<Button onClick={() => cupsQuery.refetch()}>Reintentar</Button>}
        />
      ) : total === 0 && debouncedSearch ? (
        <EmptyState
          icon={<MapPin />}
          title="Sin resultados"
          description={`No hay CUPS que coincidan con "${debouncedSearch}".`}
          action={
            <Button variant="outline" onClick={() => handleSearchChange("")}>
              Limpiar búsqueda
            </Button>
          }
        />
      ) : total === 0 ? (
        <EmptyState
          icon={<MapPin />}
          title="Aún no tienes CUPS"
          description="Crea el primero o importa desde la consulta SIPS del CNMC."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" aria-hidden />
              Crear primer CUPS
            </Button>
          }
        />
      ) : (
        <>
          <CupsTable
            data={items}
            onSelect={setSelectedCupsId}
            onSipsQuery={handleSipsQuery}
            isRefetching={cupsQuery.isFetching && !cupsQuery.isLoading}
          />
          {/* Simple pagination */}
          {total > DEFAULT_LIMIT && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {offset + 1}–{Math.min(offset + DEFAULT_LIMIT, total)} de {total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - DEFAULT_LIMIT))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset + DEFAULT_LIMIT >= total}
                  onClick={() => setOffset(offset + DEFAULT_LIMIT)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <CreateCupsDialog open={createOpen} onOpenChange={setCreateOpen} />

      {selectedCupsId && (
        <CupsDetailSheet
          cupsId={selectedCupsId}
          onClose={() => setSelectedCupsId(null)}
        />
      )}
    </div>
  );
}
