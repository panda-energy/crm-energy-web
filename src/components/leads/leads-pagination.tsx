"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LeadsFiltersInput } from "@/lib/leads/use-leads-search-params";

const PAGE_SIZES = [25, 50, 100] as const;

/**
 * Footer de paginación de la tabla de leads.
 *
 * UX:
 *  - "1-25 de 234" + selector de page-size.
 *  - Botones prev/next disabled en los extremos.
 *  - Saltar al final se omite en MVP — la mayoría de tenants tendrá pocos
 *    leads.
 */
export interface LeadsPaginationProps {
  total: number;
  limit: number;
  offset: number;
  onChange: (patch: LeadsFiltersInput) => void;
}

export function LeadsPagination({
  total,
  limit,
  offset,
  onChange,
}: LeadsPaginationProps) {
  const start = total === 0 ? 0 : offset + 1;
  const end = Math.min(offset + limit, total);
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <div className="flex flex-col items-start gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {total === 0
          ? "Sin resultados"
          : `${start.toLocaleString("es-ES")}–${end.toLocaleString("es-ES")} de ${total.toLocaleString("es-ES")}`}
      </p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="leads-page-size" className="text-xs text-muted-foreground">
            Por página
          </Label>
          <Select
            value={String(limit)}
            onValueChange={(v) => onChange({ limit: Number(v), offset: 0 })}
          >
            <SelectTrigger id="leads-page-size" className="h-8 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={!canPrev}
            aria-label="Página anterior"
            onClick={() =>
              onChange({ offset: Math.max(offset - limit, 0) })
            }
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={!canNext}
            aria-label="Página siguiente"
            onClick={() => onChange({ offset: offset + limit })}
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
