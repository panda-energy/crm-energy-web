"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Database, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Cups } from "@/lib/api/hooks/use-cups";
import { toast } from "@/lib/ui/toast";
import { cn } from "@/lib/utils/cn";
import { CupsStatusBadge } from "./cups-status-badge";

/**
 * Table component for CUPS list (F-3.1).
 *
 * Columns: code, address, distributor, tariff_access, power (p1), status, actions.
 * Clicking a row dispatches `onSelect`.
 */
export interface CupsTableProps {
  data: Cups[];
  onSelect: (cupsId: string) => void;
  onSipsQuery: (cups: Cups) => void;
  isRefetching?: boolean;
}

export function CupsTable({
  data,
  onSelect,
  onSipsQuery,
  isRefetching,
}: CupsTableProps) {
  const columns = useMemo<ColumnDef<Cups, unknown>[]>(
    () => [
      {
        id: "code",
        header: "CUPS",
        accessorFn: (row) => row.code,
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.code}</span>
        ),
      },
      {
        id: "address",
        header: "Dirección",
        accessorFn: (row) => row.address,
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate text-sm">
            {row.original.address ?? (
              <span className="text-muted-foreground">Sin dirección</span>
            )}
          </span>
        ),
      },
      {
        id: "city",
        header: "Ciudad",
        accessorFn: (row) => row.city,
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.city ?? "-"}
          </span>
        ),
      },
      {
        id: "distributor",
        header: "Distribuidora",
        accessorFn: (row) => row.distributor_name,
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.distributor_name ?? (
              <span className="text-muted-foreground">Desconocida</span>
            )}
          </span>
        ),
      },
      {
        id: "tariff",
        header: "Tarifa",
        accessorFn: (row) => row.tariff_access_code,
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.tariff_access_code ?? "-"}
          </span>
        ),
      },
      {
        id: "power",
        header: "Potencia P1",
        accessorFn: (row) => row.power_p1_kw,
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.power_p1_kw
              ? `${row.original.power_p1_kw} kW`
              : "-"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Estado",
        accessorFn: (row) => row.status,
        cell: ({ row }) => <CupsStatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <SipsButton cups={row.original} onSipsQuery={onSipsQuery} />
        ),
      },
    ],
    [onSipsQuery],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div
      className={cn(
        "w-full overflow-auto rounded-lg border border-border bg-surface",
        isRefetching && "opacity-70 transition-opacity",
      )}
    >
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-border bg-muted/40">
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
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
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => onSelect(row.original.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(row.original.id);
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

/** Inline SIPS button that stops row click propagation. */
function SipsButton({
  cups,
  onSipsQuery,
}: {
  cups: Cups;
  onSipsQuery: (cups: Cups) => void;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5"
          disabled={loading}
          onClick={(e) => {
            e.stopPropagation();
            setLoading(true);
            onSipsQuery(cups);
            // Reset after 2s (the parent handles the actual query)
            setTimeout(() => setLoading(false), 2000);
          }}
          aria-label={`Consultar SIPS para ${cups.code}`}
        >
          {loading ? (
            <RefreshCw className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Database className="size-3.5" aria-hidden />
          )}
          <span className="hidden sm:inline">SIPS</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Consultar datos SIPS del CNMC</TooltipContent>
    </Tooltip>
  );
}
