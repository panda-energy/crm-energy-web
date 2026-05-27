"use client";

import {
  useCommissionSummary,
  useCommissions,
} from "@/lib/api/hooks/use-channels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CommissionChart } from "./commission-chart";

/**
 * MyDashboardTab -- personal commission dashboard for the logged-in agent.
 *
 * Shows summary cards (pending/approved/paid), progress bar vs target,
 * and a monthly bar chart of the last 6 months.
 */

function formatCents(cents: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function MyDashboardTab() {
  const summaryQuery = useCommissionSummary();
  const commissionsQuery = useCommissions({ limit: 200 });

  if (summaryQuery.isLoading) {
    return (
      <div className="space-y-4" role="status" aria-label="Cargando dashboard">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const summary = summaryQuery.data;
  if (!summary) return null;

  const progressPct = summary.target_cents
    ? Math.min(
        100,
        Math.round((summary.current_month_cents / summary.target_cents) * 100),
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">
              {formatCents(summary.total_pending_cents)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Aprobado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-brand">
              {formatCents(summary.total_approved_cents)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pagado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">
              {formatCents(summary.total_paid_cents)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Target progress */}
      {progressPct !== null && summary.target_cents ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Objetivo mensual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                {formatCents(summary.current_month_cents)} de{" "}
                {formatCents(summary.target_cents)}
              </span>
              <span className="font-semibold">{progressPct}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand transition-all duration-500"
                style={{ width: `${progressPct}%` }}
                role="progressbar"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${progressPct}% del objetivo mensual`}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.contracts_count} contratos generando comision
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Monthly chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Comisiones mensuales (6 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CommissionChart
            commissions={commissionsQuery.data?.items ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
