"use client";

import { ArrowDown, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuoteCalculateResponse } from "@/lib/api/hooks/use-quotes";
import { cn } from "@/lib/utils/cn";

/**
 * Visual savings summary from a quote calculation (F-3.4).
 *
 * Shows: baseline vs projected, savings amount and %, with a comparison bar.
 */
interface QuoteSummaryProps {
  quote: QuoteCalculateResponse | null;
  isLoading?: boolean;
  error?: Error | null;
}

export function QuoteSummary({ quote, isLoading, error }: QuoteSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-4 text-sm text-destructive">
          Error al calcular ahorro: {error.message}
        </CardContent>
      </Card>
    );
  }

  if (!quote) return null;

  const baseline = parseFloat(quote.baseline_eur);
  const projected = parseFloat(quote.projected_eur);
  const savings = parseFloat(quote.savings_eur);
  const savingsPct = parseFloat(quote.savings_pct);
  const projectedRatio = baseline > 0 ? (projected / baseline) * 100 : 100;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingDown className="size-4 text-emerald-500" aria-hidden />
          Simulación de ahorro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Big savings number */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {savings.toFixed(2)} EUR
          </span>
          <span className="text-sm text-muted-foreground">
            de ahorro anual
          </span>
        </div>

        {/* Percentage */}
        <div className="flex items-center gap-1.5">
          <ArrowDown className="size-4 text-emerald-500" aria-hidden />
          <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            {savingsPct.toFixed(1)}%
          </span>
          <span className="text-sm text-muted-foreground">menos que ahora</span>
        </div>

        {/* Comparison bar */}
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Factura actual</span>
              <span className="font-medium">{baseline.toFixed(2)} EUR/anio</span>
            </div>
            <div className="h-3 w-full rounded-full bg-red-500/20">
              <div
                className="h-full rounded-full bg-red-500 transition-all"
                style={{ width: "100%" }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Con Panda Energy</span>
              <span className="font-medium">{projected.toFixed(2)} EUR/anio</span>
            </div>
            <div className="h-3 w-full rounded-full bg-emerald-500/20">
              <div
                className={cn(
                  "h-full rounded-full bg-emerald-500 transition-all",
                )}
                style={{ width: `${Math.max(projectedRatio, 5)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Assumptions */}
        {quote.assumptions.length > 0 && (
          <div className="space-y-1 border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground">
              Supuestos del cálculo:
            </p>
            <ul className="space-y-0.5">
              {quote.assumptions.map((a, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  - {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
