"use client";

import { useState, useMemo, useCallback } from "react";
import { Radio } from "lucide-react";
import { useAtrMessages } from "@/lib/api/hooks/use-atr";
import type { AtrMessage } from "@/lib/api/types-sprint4";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AtrStatsCards } from "./atr-stats-cards";
import { AtrFilters, type AtrFiltersState } from "./atr-filters";
import { AtrTable } from "./atr-table";
import { AtrDetailSheet } from "./atr-detail-sheet";

/**
 * Client component for the ATR messages dashboard.
 * Handles filtering, stats, table, and detail sheet.
 */
export function AtrPageClient() {
  const [filters, setFilters] = useState<AtrFiltersState>({
    q: "",
    messageType: "all",
    status: "all",
    distributor: "all",
  });
  const [selectedMessage, setSelectedMessage] = useState<AtrMessage | null>(
    null,
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const queryParams = useMemo(
    () => ({
      q: filters.q || undefined,
      message_type:
        filters.messageType !== "all" ? [filters.messageType] : undefined,
      status: filters.status !== "all" ? [filters.status] : undefined,
      distributor:
        filters.distributor !== "all" ? filters.distributor : undefined,
      limit: 50,
    }),
    [filters],
  );

  const { data, isLoading, isError, error } = useAtrMessages(queryParams);

  const handleRowClick = useCallback((message: AtrMessage) => {
    setSelectedMessage(message);
    setSheetOpen(true);
  }, []);

  const handleSheetClose = useCallback(() => {
    setSheetOpen(false);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Monitorizacion ATR
          </h1>
          <p className="text-sm text-muted-foreground">
            Mensajes regulatorios CNMC: estados, reintentos y SLA por
            distribuidora.
          </p>
        </div>
      </div>

      {/* Stats cards */}
      {data && <AtrStatsCards messages={data.items} />}

      {/* Filters */}
      <AtrFilters filters={filters} onFiltersChange={setFilters} />

      {/* Table */}
      {isLoading && <TableSkeleton rows={8} cols={7} />}
      {isError && (
        <EmptyState
          icon={<Radio />}
          title="Error al cargar mensajes ATR"
          description={error?.message ?? "Intenta de nuevo mas tarde."}
        />
      )}
      {data && data.items.length === 0 && (
        <EmptyState
          icon={<Radio />}
          title="Sin mensajes ATR"
          description="No hay mensajes que coincidan con los filtros seleccionados."
        />
      )}
      {data && data.items.length > 0 && (
        <>
          <AtrTable data={data.items} onRowClick={handleRowClick} />
          <p className="text-xs text-muted-foreground">
            Mostrando {data.items.length} de {data.total} mensajes
          </p>
        </>
      )}

      {/* Detail sheet */}
      <AtrDetailSheet
        message={selectedMessage}
        open={sheetOpen}
        onClose={handleSheetClose}
      />
    </div>
  );
}
