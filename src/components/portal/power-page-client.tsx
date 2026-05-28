"use client";

import { Zap } from "lucide-react";
import { usePowerModificationRequests } from "@/lib/api/hooks/use-portal";
import type { PowerRequestStatus } from "@/lib/api/types-sprint5";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PowerForm } from "./power-form";

/**
 * PowerPageClient -- portal power modification page.
 *
 * Shows a form to request power changes and a table of previous requests.
 */

const STATUS_CONFIG: Record<
  PowerRequestStatus,
  { label: string; variant: "warning" | "default" | "success" | "destructive" }
> = {
  pending: { label: "Pendiente", variant: "warning" },
  sent_to_dso: { label: "Enviada a distribuidora", variant: "default" },
  approved: { label: "Aprobada", variant: "success" },
  rejected: { label: "Rechazada", variant: "destructive" },
};

export function PowerPageClient() {
  const {
    data: requests,
    isLoading,
    isError,
    error,
  } = usePowerModificationRequests();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Modificar potencia
      </h1>

      {/* Form -- using fixture data for demo contract */}
      <PowerForm
        contractId="77777777-7777-7777-7777-770000000001"
        cupsCode="ES0021000000350832AJ"
        currentPower={[5.75, 5.75]}
      />

      {/* Previous requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Solicitudes anteriores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div
              className="space-y-3"
              role="status"
              aria-label="Cargando solicitudes"
            >
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <EmptyState
              icon={<Zap />}
              title="Error al cargar solicitudes"
              description={error?.message}
            />
          ) : !requests || requests.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No hay solicitudes anteriores
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Solicitudes de modificacion de potencia">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">
                      CUPS
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Potencia actual
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Potencia solicitada
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Estado
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => {
                    const statusConf = STATUS_CONFIG[req.status];
                    return (
                      <tr
                        key={req.id}
                        className="border-b border-border transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-2 font-mono text-xs">
                          {req.cups_code}
                        </td>
                        <td className="px-4 py-2 tabular-nums">
                          {req.current_power_kw
                            .map((kw) => `${kw} kW`)
                            .join(" / ")}
                        </td>
                        <td className="px-4 py-2 tabular-nums">
                          {req.requested_power_kw
                            .map((kw) => `${kw} kW`)
                            .join(" / ")}
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant={statusConf.variant}>
                            {statusConf.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {new Date(req.created_at).toLocaleDateString(
                            "es-ES",
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
