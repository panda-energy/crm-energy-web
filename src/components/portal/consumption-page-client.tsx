"use client";

import { useState } from "react";
import { useCustomerConsumption } from "@/lib/api/hooks/use-portal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3 } from "lucide-react";
import { ConsumptionChart } from "./consumption-chart";

/**
 * ConsumptionPageClient -- portal view of energy consumption with chart + table.
 */

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

function formatCents(cents: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function ConsumptionPageClient() {
  const [year, setYear] = useState<number | undefined>(undefined);
  const { data, isLoading, isError, error } = useCustomerConsumption(year);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Mi consumo</h1>
        <Select
          value={year ? String(year) : "all"}
          onValueChange={(v) =>
            setYear(v === "all" ? undefined : Number(v))
          }
        >
          <SelectTrigger className="w-32" aria-label="Seleccionar periodo">
            <SelectValue placeholder="Periodo" />
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
      </div>

      {isLoading ? (
        <div className="space-y-4" role="status" aria-label="Cargando consumo">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={<BarChart3 />}
          title="Error al cargar consumo"
          description={error?.message}
        />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<BarChart3 />}
          title="Sin datos de consumo"
          description="No hay datos de consumo disponibles para el periodo seleccionado."
        />
      ) : (
        <>
          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Consumo mensual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ConsumptionChart data={data} />
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Detalle por mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">
                        Periodo
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">
                        Consumo (kWh)
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">
                        Importe
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item) => (
                      <tr
                        key={item.period}
                        className="border-b border-border transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-2 font-medium">
                          {item.period}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {item.energy_kwh.toLocaleString("es-ES")} kWh
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {formatCents(item.amount_cents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border font-semibold">
                      <td className="px-4 py-2">Total</td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {data
                          .reduce((sum, c) => sum + c.energy_kwh, 0)
                          .toLocaleString("es-ES")}{" "}
                        kWh
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {formatCents(
                          data.reduce((sum, c) => sum + c.amount_cents, 0),
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
