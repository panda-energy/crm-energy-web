"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Download, Send, XCircle } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Contract } from "@/lib/api/hooks/use-contracts";
import { getContractPdfUrl } from "@/lib/api/hooks/use-contracts";
import { cn } from "@/lib/utils/cn";
import { ContractStatusBadge } from "./contract-status-badge";

/**
 * Contracts table (F-3.6).
 *
 * Columns: number, customer_name, CUPS (code), product, status, created_at, actions.
 */
export interface ContractsTableProps {
  data: Contract[];
  onSelect: (contractId: string) => void;
  onSign: (contractId: string) => void;
  onCancel: (contractId: string) => void;
  isRefetching?: boolean;
}

export function ContractsTable({
  data,
  onSelect,
  onSign,
  onCancel,
  isRefetching,
}: ContractsTableProps) {
  const columns = useMemo<ColumnDef<Contract, unknown>[]>(
    () => [
      {
        id: "number",
        header: "Contrato",
        accessorFn: (row) => row.number,
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">
            {row.original.number}
          </span>
        ),
      },
      {
        id: "customer",
        header: "Cliente",
        accessorFn: (row) => row.customer_name,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {row.original.customer_name}
            </p>
            {row.original.customer_email && (
              <p className="truncate text-xs text-muted-foreground">
                {row.original.customer_email}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "status",
        header: "Estado",
        accessorFn: (row) => row.status,
        cell: ({ row }) => (
          <ContractStatusBadge status={row.original.status} />
        ),
      },
      {
        id: "term",
        header: "Duración",
        accessorFn: (row) => row.term_months,
        cell: ({ row }) => (
          <span className="text-sm">{row.original.term_months} meses</span>
        ),
      },
      {
        id: "created",
        header: "Creado",
        accessorFn: (row) => row.created_at,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.original.created_at).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <ContractActions
            contract={row.original}
            onSign={onSign}
            onCancel={onCancel}
          />
        ),
      },
    ],
    [onSign, onCancel],
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
      <table className="w-full" aria-label="Contratos">
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

/** Actions buttons per row. */
function ContractActions({
  contract,
  onSign,
  onCancel,
}: {
  contract: Contract;
  onSign: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {/* Download PDF */}
      {contract.pdf_storage_key && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              asChild
            >
              <a
                href={getContractPdfUrl(contract.id)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Descargar PDF"
              >
                <Download className="size-3.5" aria-hidden />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Descargar PDF</TooltipContent>
        </Tooltip>
      )}

      {/* Send to sign — only for draft with PDF */}
      {contract.status === "draft" && contract.pdf_storage_key && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => onSign(contract.id)}
              aria-label="Enviar a firma"
            >
              <Send className="size-3.5" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Enviar a firma</TooltipContent>
        </Tooltip>
      )}

      {/* Cancel — only for non-terminal states */}
      {!["cancelled", "rejected", "active"].includes(contract.status) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-destructive hover:text-destructive"
              onClick={() => onCancel(contract.id)}
              aria-label="Cancelar contrato"
            >
              <XCircle className="size-3.5" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cancelar contrato</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
