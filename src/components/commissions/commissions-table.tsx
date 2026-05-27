"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  useCommissions,
  useChannels,
  type UseCommissionsParams,
} from "@/lib/api/hooks/use-channels";
import type { Commission, CommissionStatus } from "@/lib/api/types-sprint5";
import { CommissionStatusBadge } from "./commission-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wallet } from "lucide-react";

/**
 * CommissionsTable -- paginated table of commissions with filters.
 */

const columnHelper = createColumnHelper<Commission>();

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function CommissionsTable() {
  const [filters, setFilters] = useState<UseCommissionsParams>({
    limit: 50,
  });

  const commissionsQuery = useCommissions(filters);
  const channelsQuery = useChannels();

  const channelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const ch of channelsQuery.data ?? []) {
      map.set(ch.id, ch.name);
    }
    return map;
  }, [channelsQuery.data]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("period", {
        header: "Periodo",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("channel_id", {
        header: "Canal",
        cell: (info) => channelMap.get(info.getValue()) ?? info.getValue(),
      }),
      columnHelper.accessor("amount_cents", {
        header: "Importe",
        cell: (info) =>
          formatCents(info.getValue(), info.row.original.currency),
      }),
      columnHelper.accessor("status", {
        header: "Estado",
        cell: (info) => <CommissionStatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor("created_at", {
        header: "Fecha",
        cell: (info) =>
          new Date(info.getValue()).toLocaleDateString("es-ES"),
      }),
    ],
    [channelMap],
  );

  const data = commissionsQuery.data?.items ?? [];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Totals
  const totals = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let paid = 0;
    for (const c of data) {
      if (c.status === "pending") pending += c.amount_cents;
      if (c.status === "approved") approved += c.amount_cents;
      if (c.status === "paid") paid += c.amount_cents;
    }
    return { pending, approved, paid };
  }, [data]);

  if (commissionsQuery.isLoading) {
    return (
      <div className="space-y-3" role="status" aria-label="Cargando liquidaciones">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.status?.join(",") ?? "all"}
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              status: v === "all" ? undefined : [v as CommissionStatus],
            }))
          }
        >
          <SelectTrigger className="w-40" aria-label="Filtrar por estado">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="approved">Aprobada</SelectItem>
            <SelectItem value="paid">Pagada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Periodo (2026-05)"
          className="w-40"
          value={filters.period ?? ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              period: e.target.value || undefined,
            }))
          }
          aria-label="Filtrar por periodo"
        />
      </div>

      {/* Table */}
      {data.length === 0 ? (
        <EmptyState
          icon={<Wallet />}
          title="Sin liquidaciones"
          description="No hay liquidaciones que coincidan con los filtros."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border transition-colors hover:bg-muted/30"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2.5">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/50 text-xs font-semibold">
                <td className="px-4 py-2" colSpan={2}>
                  Totales visibles
                </td>
                <td className="px-4 py-2" colSpan={3}>
                  <span className="mr-4">Pend: {formatCents(totals.pending, "EUR")}</span>
                  <span className="mr-4">Aprob: {formatCents(totals.approved, "EUR")}</span>
                  <span>Pagado: {formatCents(totals.paid, "EUR")}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
