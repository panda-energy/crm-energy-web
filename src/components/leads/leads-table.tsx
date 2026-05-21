"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Lead } from "@/lib/api/hooks/use-leads";
import type { PipelineStage } from "@/lib/api/hooks/use-pipelines";
import {
  composeInitials,
  composeLeadName,
  formatPhone,
} from "@/lib/leads/format";
import { formatRelativeTime } from "@/lib/leads/relative-time";
import { useLeadsUiStore } from "@/lib/leads/leads-ui-store";
import type {
  LeadSortField,
  LeadsFiltersInput,
  SortDirection,
} from "@/lib/leads/use-leads-search-params";
import { cn } from "@/lib/utils/cn";
import { LeadStatusBadge } from "./lead-status-badge";

/**
 * Tabla de leads (F-2.1).
 *
 * Decisiones:
 *  - **TanStack Table v8** para columnas tipadas + sort + selection.
 *  - **Virtualización** condicional (>50 filas) con `@tanstack/react-virtual`
 *    sobre `<tbody>`. Por debajo, el overhead del virtualizer supera al
 *    beneficio (un grid CSS sería más simple).
 *  - **Sort server-side**: solo `created_at | updated_at | last_contacted_at
 *    | status` están whitelisted en backend. El resto muestra el icono
 *    deshabilitado con tooltip explicativo.
 *  - **Selección** en Zustand (`useLeadsUiStore`), no en URL.
 *  - **Click en fila** navega a `/leads/{id}` (la ruta dinámica renderiza el
 *    Sheet de detalle encima de la tabla — F-2.4).
 *
 * Server-state: `data` viene del caller; este componente NO fetcha.
 */
export interface LeadsTableProps {
  /** Filas a renderizar (página actual). */
  data: Lead[];
  /** Stages del primer pipeline cargado — usado para resolver `stage_id` a nombre. */
  stagesById: Map<string, PipelineStage>;
  sort?: LeadSortField;
  direction?: SortDirection;
  onSortChange: (patch: LeadsFiltersInput) => void;
  /** True mientras la query principal carga (no la inicial). */
  isRefetching?: boolean;
}

const SORTABLE_FIELDS: ReadonlyArray<LeadSortField> = [
  "created_at",
  "updated_at",
  "last_contacted_at",
  "status",
];

const TOOLTIP_NO_SORT = "Ordenable solo por: creado, actualizado, último contacto, estado.";

export function LeadsTable({
  data,
  stagesById,
  sort,
  direction,
  onSortChange,
  isRefetching,
}: LeadsTableProps) {
  const router = useRouter();

  const selectedIds = useLeadsUiStore((s) => s.selectedIds);
  const toggleSelection = useLeadsUiStore((s) => s.toggleSelection);
  const selectMany = useLeadsUiStore((s) => s.selectMany);
  const unselectMany = useLeadsUiStore((s) => s.unselectMany);

  const allVisibleIds = useMemo(() => data.map((d) => d.id), [data]);
  const allSelectedInPage =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id));
  const someSelectedInPage = allVisibleIds.some((id) => selectedIds.has(id));

  const headerCheckboxState: boolean | "indeterminate" = allSelectedInPage
    ? true
    : someSelectedInPage
      ? "indeterminate"
      : false;

  // TanStack Table sorting state (controlado por el caller via URL).
  const sorting: SortingState = sort
    ? [{ id: sort, desc: direction !== "asc" }]
    : [];

  const columns = useMemo<ColumnDef<Lead>[]>(
    () => [
      {
        id: "_select",
        size: 36,
        header: () => (
          <Checkbox
            checked={headerCheckboxState}
            onCheckedChange={(checked) => {
              if (checked) selectMany(allVisibleIds);
              else unselectMany(allVisibleIds);
            }}
            aria-label={
              allSelectedInPage
                ? "Deseleccionar todos los leads visibles"
                : "Seleccionar todos los leads visibles"
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={() => toggleSelection(row.original.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Seleccionar lead ${composeLeadName(row.original)}`}
          />
        ),
      },
      {
        id: "name",
        header: "Nombre",
        accessorFn: (lead) => composeLeadName(lead),
        cell: ({ row }) => {
          const lead = row.original;
          return (
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="size-7 shrink-0 text-xs">
                <AvatarFallback>{composeInitials(lead)}</AvatarFallback>
              </Avatar>
              <span className="truncate font-medium text-foreground">
                {composeLeadName(lead)}
              </span>
            </div>
          );
        },
      },
      {
        id: "email",
        header: "Email",
        accessorKey: "email",
        cell: ({ row }) => (
          <span className="truncate text-sm text-muted-foreground">
            {row.original.email ?? "—"}
          </span>
        ),
      },
      {
        id: "phone",
        header: "Teléfono",
        accessorKey: "phone_e164",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatPhone(row.original.phone_e164) || "—"}
          </span>
        ),
      },
      {
        id: "company",
        header: "Empresa",
        accessorKey: "company",
        cell: ({ row }) => (
          <span className="truncate text-sm text-muted-foreground">
            {row.original.company ?? "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Estado",
        accessorKey: "status",
        cell: ({ row }) => <LeadStatusBadge status={row.original.status} />,
      },
      {
        id: "stage",
        header: "Etapa",
        accessorKey: "stage_id",
        cell: ({ row }) => {
          const stage = stagesById.get(row.original.stage_id);
          return (
            <Badge variant="outline" className="text-xs font-normal">
              {stage?.name ?? "—"}
            </Badge>
          );
        },
      },
      {
        id: "owner",
        header: "Propietario",
        accessorKey: "owner_id",
        cell: ({ row }) => {
          const owner = row.original.owner_id;
          if (!owner) {
            return (
              <span className="text-xs italic text-muted-foreground">
                Sin asignar
              </span>
            );
          }
          return (
            <span className="font-mono text-[11px] text-muted-foreground">
              {owner.slice(0, 8)}…
            </span>
          );
        },
      },
      {
        id: "tags",
        header: "Etiquetas",
        accessorKey: "tags",
        cell: ({ row }) => {
          const tags = row.original.tags;
          if (tags.length === 0) return <span className="text-muted-foreground">—</span>;
          const visible = tags.slice(0, 2);
          const remaining = tags.length - visible.length;
          return (
            <div className="flex flex-wrap gap-1">
              {visible.map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px]">
                  {t}
                </Badge>
              ))}
              {remaining > 0 ? (
                <Badge variant="outline" className="text-[10px]">
                  +{remaining}
                </Badge>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "last_contacted_at",
        header: "Último contacto",
        accessorKey: "last_contacted_at",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatRelativeTime(row.original.last_contacted_at)}
          </span>
        ),
      },
      {
        id: "updated_at",
        header: "Actualizado",
        accessorKey: "updated_at",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatRelativeTime(row.original.updated_at)}
          </span>
        ),
      },
    ],
    [
      headerCheckboxState,
      allSelectedInPage,
      allVisibleIds,
      selectMany,
      unselectMany,
      selectedIds,
      toggleSelection,
      stagesById,
    ],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  // Virtualización solo si vale la pena.
  const parentRef = useRef<HTMLDivElement>(null);
  const enableVirtual = data.length > 50;
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 12,
    enabled: enableVirtual,
  });

  const handleSort = (field: string) => {
    if (!SORTABLE_FIELDS.includes(field as LeadSortField)) return;
    const typed = field as LeadSortField;
    let next: SortDirection = "desc";
    if (sort === typed) {
      next = direction === "asc" ? "desc" : "asc";
    }
    onSortChange({ sort: typed, direction: next });
  };

  const renderSortIndicator = (field: string) => {
    const isSortable = SORTABLE_FIELDS.includes(field as LeadSortField);
    if (!isSortable) {
      return <ArrowUpDown className="size-3 opacity-25" aria-hidden />;
    }
    if (sort !== field) {
      return <ArrowUpDown className="size-3 opacity-50" aria-hidden />;
    }
    return direction === "asc" ? (
      <ArrowUp className="size-3 text-brand" aria-hidden />
    ) : (
      <ArrowDown className="size-3 text-brand" aria-hidden />
    );
  };

  const rows = table.getRowModel().rows;
  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = enableVirtual && virtualItems.length > 0 ? virtualItems[0]!.start : 0;
  const paddingBottom =
    enableVirtual && virtualItems.length > 0
      ? totalSize - virtualItems[virtualItems.length - 1]!.end
      : 0;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-border bg-surface",
        isRefetching && "opacity-90",
      )}
    >
      {isRefetching ? (
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 h-0.5 animate-pulse bg-brand/70"
          aria-hidden
        />
      ) : null}
      <div
        ref={parentRef}
        className="max-h-[calc(100vh-18rem)] overflow-auto"
        // reason: el virtualizer necesita un contenedor con overflow para
        // medir el scroll. Limitamos la altura a "viewport - header/footer
        // approx" — refinable más adelante.
      >
        <table className="w-full text-sm" role="table" aria-label="Lista de leads">
          <thead className="sticky top-0 z-10 bg-surface text-xs uppercase tracking-wide text-muted-foreground shadow-sm">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border">
                {hg.headers.map((header) => {
                  const field = header.id;
                  const isSortable = SORTABLE_FIELDS.includes(
                    field as LeadSortField,
                  );
                  const isSorted = sort === field;
                  const isSelectColumn = field === "_select";
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      style={{ width: header.getSize() || undefined }}
                      aria-sort={
                        isSorted
                          ? direction === "asc"
                            ? "ascending"
                            : "descending"
                          : isSortable
                            ? "none"
                            : undefined
                      }
                      className={cn(
                        "px-3 py-2 text-left font-medium",
                        isSelectColumn && "w-9",
                      )}
                    >
                      {isSelectColumn ? (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      ) : isSortable ? (
                        <button
                          type="button"
                          onClick={() => handleSort(field)}
                          className={cn(
                            "inline-flex items-center gap-1.5",
                            "cursor-pointer hover:text-foreground",
                            "focus-visible:outline-none focus-visible:underline",
                          )}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {renderSortIndicator(field)}
                        </button>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              disabled
                              className={cn(
                                "inline-flex items-center gap-1.5",
                                "cursor-default opacity-90",
                                "focus-visible:outline-none focus-visible:underline",
                              )}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {renderSortIndicator(field)}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{TOOLTIP_NO_SORT}</TooltipContent>
                        </Tooltip>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 ? (
              <tr aria-hidden style={{ height: paddingTop }}>
                <td colSpan={columns.length} />
              </tr>
            ) : null}
            {(enableVirtual ? virtualItems : rows.map((_, i) => ({ index: i, start: 0, end: 0, size: 0 }))).map(
              (vi) => {
                const row = rows[vi.index]!;
                const lead = row.original;
                const isSelected = selectedIds.has(lead.id);
                return (
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/leads/${lead.id}`)}
                    aria-selected={isSelected}
                    className={cn(
                      "cursor-pointer border-b border-border transition-colors",
                      "hover:bg-muted/40 focus-within:bg-muted/40",
                      isSelected && "bg-brand/5",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          "max-w-[200px] truncate px-3 py-2 align-middle",
                          cell.column.id === "_select" && "w-9",
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              },
            )}
            {paddingBottom > 0 ? (
              <tr aria-hidden style={{ height: paddingBottom }}>
                <td colSpan={columns.length} />
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Botón "kebab" para acciones de fila — exportado por si lo usamos en
 * iteraciones posteriores. Por ahora la tabla no expone acciones inline
 * (todo va por click → Sheet).
 */
export function LeadRowMenuButton({ ariaLabel }: { ariaLabel: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={ariaLabel}
      className="size-7"
      onClick={(e) => e.stopPropagation()}
    >
      <MoreHorizontal className="size-4" aria-hidden />
    </Button>
  );
}
