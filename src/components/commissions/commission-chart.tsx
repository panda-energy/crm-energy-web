"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Commission } from "@/lib/api/types-sprint5";

/**
 * CommissionChart -- bar chart of monthly commissions (last 6 months).
 *
 * Groups commissions by period and shows paid vs pending bars.
 */

interface MonthlyData {
  period: string;
  paid: number;
  pending: number;
  approved: number;
}

function aggregateByMonth(commissions: Commission[]): MonthlyData[] {
  const monthMap = new Map<string, MonthlyData>();

  for (const c of commissions) {
    const existing = monthMap.get(c.period) ?? {
      period: c.period,
      paid: 0,
      pending: 0,
      approved: 0,
    };
    if (c.status === "paid") existing.paid += c.amount_cents / 100;
    if (c.status === "pending") existing.pending += c.amount_cents / 100;
    if (c.status === "approved") existing.approved += c.amount_cents / 100;
    monthMap.set(c.period, existing);
  }

  return Array.from(monthMap.values())
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-6);
}

export interface CommissionChartProps {
  commissions: Commission[];
}

export function CommissionChart({ commissions }: CommissionChartProps) {
  const data = aggregateByMonth(commissions);

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Sin datos para el grafico
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 12 }}
            className="fill-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            className="fill-muted-foreground"
            tickFormatter={(v: number) => `${v}e`}
          />
          <Tooltip
            formatter={(value: number) => [
              `${value.toFixed(2)} EUR`,
            ]}
            contentStyle={{
              backgroundColor: "hsl(var(--surface))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Bar dataKey="paid" name="Pagado" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="approved" name="Aprobado" fill="hsl(var(--brand))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pending" name="Pendiente" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
