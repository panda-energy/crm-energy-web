"use client";

import { useCallback, useState } from "react";
import { Download, FileText } from "lucide-react";
import {
  useCustomerInvoices,
  downloadInvoicePdf,
  type UsePortalInvoicesParams,
} from "@/lib/api/hooks/use-portal";
import { useClerkApiContext } from "@/lib/api/hooks/clerk-context";
import type { InvoiceStatus } from "@/lib/api/types-sprint5";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { InvoiceStatusBadge } from "./invoice-status-badge";

/**
 * InvoicesPageClient -- portal view of customer invoices with PDF download.
 */

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function InvoicesPageClient() {
  const { getToken } = useClerkApiContext();
  const [filters, setFilters] = useState<UsePortalInvoicesParams>({
    limit: 50,
  });

  const { data, isLoading, isError, error } = useCustomerInvoices(filters);
  const invoices = data?.items ?? [];

  const handleDownloadPdf = useCallback(
    async (invoiceId: string) => {
      try {
        await downloadInvoicePdf(invoiceId, getToken);
      } catch {
        // toast import would be needed; for now silently fail
      }
    },
    [getToken],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Mis facturas</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.year ? String(filters.year) : "all"}
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              year: v === "all" ? undefined : Number(v),
            }))
          }
        >
          <SelectTrigger className="w-32" aria-label="Filtrar por anio">
            <SelectValue placeholder="Anio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              status: v === "all" ? undefined : (v as InvoiceStatus),
            }))
          }
        >
          <SelectTrigger className="w-32" aria-label="Filtrar por estado">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="paid">Pagada</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="overdue">Vencida</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3" role="status" aria-label="Cargando facturas">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<FileText />}
          title="Error al cargar facturas"
          description={error?.message}
        />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="Sin facturas"
          description="No hay facturas que coincidan con los filtros seleccionados."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm" aria-label="Facturas">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                  Numero
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                  Periodo
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">
                  Importe
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                  Estado
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                  Emision
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                  Vencimiento
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">
                  PDF
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-border transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-2.5 font-medium">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-4 py-2.5">{invoice.period}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {formatCents(invoice.amount_cents, invoice.currency)}
                  </td>
                  <td className="px-4 py-2.5">
                    <InvoiceStatusBadge status={invoice.status} />
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {new Date(invoice.issued_at).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {new Date(invoice.due_at).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {invoice.pdf_url ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleDownloadPdf(invoice.id)}
                        aria-label={`Descargar PDF ${invoice.invoice_number}`}
                      >
                        <Download className="size-4" aria-hidden />
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        --
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
