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
import type { CustomerConsumption } from "@/lib/api/types-sprint5";

/**
 * ConsumptionChart -- monthly bar chart showing kWh and EUR.
 */

interface ChartData {
  period: string;
  kwh: number;
  eur: number;
}

function toChartData(data: CustomerConsumption[]): ChartData[] {
  return data.map((c) => ({
    period: c.period,
    kwh: c.energy_kwh,
    eur: c.amount_cents / 100,
  }));
}

export interface ConsumptionChartProps {
  data: CustomerConsumption[];
}

export function ConsumptionChart({ data }: ConsumptionChartProps) {
  const chartData = toChartData(data);

  if (chartData.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Sin datos de consumo disponibles
      </p>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
          />
          <YAxis
            yAxisId="kwh"
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
            label={{
              value: "kWh",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11 },
            }}
          />
          <YAxis
            yAxisId="eur"
            orientation="right"
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
            label={{
              value: "EUR",
              angle: 90,
              position: "insideRight",
              style: { fontSize: 11 },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--surface))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
              fontSize: "12px",
            }}
            formatter={(value: number, name: string) => {
              if (name === "kwh") return [`${value} kWh`, "Consumo"];
              return [`${value.toFixed(2)} EUR`, "Importe"];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px" }}
            formatter={(value: string) =>
              value === "kwh" ? "Consumo (kWh)" : "Importe (EUR)"
            }
          />
          <Bar
            yAxisId="kwh"
            dataKey="kwh"
            name="kwh"
            fill="hsl(var(--brand))"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="eur"
            dataKey="eur"
            name="eur"
            fill="hsl(var(--success))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
