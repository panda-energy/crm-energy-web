"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMemo } from "react";
import type { AtrMessage } from "@/lib/api/types-sprint4";
import { AtrStatusBadge } from "./atr-status-badge";
import { AtrMessageTypeBadge } from "./atr-message-type-badge";

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

const DISTRIBUTOR_LABELS: Record<string, string> = {
  "e-distribucion": "e-Distribucion",
  "i-de": "i-DE",
  ufd: "UFD",
  viesgo: "Viesgo",
  begasa: "Begasa",
};

interface AtrTableProps {
  data: AtrMessage[];
  onRowClick: (message: AtrMessage) => void;
}

export function AtrTable({ data, onRowClick }: AtrTableProps) {
  const columns = useMemo<ColumnDef<AtrMessage>[]>(
    () => [
      {
        accessorKey: "message_type",
        header: "Tipo",
        cell: ({ row }) => (
          <AtrMessageTypeBadge type={row.original.message_type} short />
        ),
        size: 60,
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => <AtrStatusBadge status={row.original.status} />,
        size: 120,
      },
      {
        accessorKey: "cups_code",
        header: "CUPS",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.cups_code}</span>
        ),
        size: 200,
      },
      {
        accessorKey: "distributor",
        header: "Distribuidora",
        cell: ({ row }) =>
          DISTRIBUTOR_LABELS[row.original.distributor] ??
          row.original.distributor,
        size: 120,
      },
      {
        accessorKey: "retry_count",
        header: "Reintentos",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.retry_count}/{row.original.max_retries}
          </span>
        ),
        size: 90,
      },
      {
        accessorKey: "sent_at",
        header: "Enviado",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.sent_at)}
          </span>
        ),
        size: 140,
      },
      {
        accessorKey: "updated_at",
        header: "Actualizado",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.updated_at)}
          </span>
        ),
        size: 140,
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="border-b border-border bg-muted/40"
            >
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                  style={{ width: header.getSize() }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-border">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick(row.original)}
              className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              tabIndex={0}
              role="button"
              aria-label={`Ver detalle ATR ${row.original.message_type} - ${row.original.cups_code}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onRowClick(row.original);
                }
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
