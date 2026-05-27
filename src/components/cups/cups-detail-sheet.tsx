"use client";

import { RefreshCw, Zap, MapPin, Building } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCup, useSips } from "@/lib/api/hooks/use-cups";
import { toast } from "@/lib/ui/toast";
import { CupsStatusBadge } from "./cups-status-badge";

/**
 * CUPS detail sheet with tabs: Info / SIPS / Contracts (F-3.2).
 */
interface CupsDetailSheetProps {
  cupsId: string;
  onClose: () => void;
}

export function CupsDetailSheet({ cupsId, onClose }: CupsDetailSheetProps) {
  const cupsQuery = useCup(cupsId);
  const cups = cupsQuery.data;

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Zap className="size-5 text-amber-500" aria-hidden />
            {cups ? (
              <span className="font-mono text-sm">{cups.code}</span>
            ) : (
              <Skeleton className="h-5 w-48" />
            )}
          </SheetTitle>
        </SheetHeader>

        {cupsQuery.isLoading ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : cupsQuery.isError ? (
          <div className="p-4 text-center">
            <p className="text-sm text-destructive">Error al cargar CUPS</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => cupsQuery.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : cups ? (
          <Tabs defaultValue="info" className="p-4">
            <TabsList className="w-full">
              <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
              <TabsTrigger value="sips" className="flex-1">SIPS</TabsTrigger>
              <TabsTrigger value="contracts" className="flex-1">Contratos</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4 space-y-4">
              <CupsInfoTab cups={cups} />
            </TabsContent>

            <TabsContent value="sips" className="mt-4">
              <SipsTab code={cups.code} />
            </TabsContent>

            <TabsContent value="contracts" className="mt-4">
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Los contratos vinculados a este CUPS se mostrarán en la tabla de contratos.
              </div>
            </TabsContent>
          </Tabs>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

/** Info tab: CUPS data fields. */
function CupsInfoTab({ cups }: { cups: NonNullable<ReturnType<typeof useCup>["data"]> }) {
  const powers = [
    { label: "P1", value: cups.power_p1_kw },
    { label: "P2", value: cups.power_p2_kw },
    { label: "P3", value: cups.power_p3_kw },
    { label: "P4", value: cups.power_p4_kw },
    { label: "P5", value: cups.power_p5_kw },
    { label: "P6", value: cups.power_p6_kw },
  ].filter((p) => p.value != null);

  return (
    <>
      <div className="flex items-center gap-2">
        <CupsStatusBadge status={cups.status} />
        <Badge variant="outline">
          {cups.energy_type === "electricity" ? "Electricidad" : "Gas"}
        </Badge>
        <Badge variant="outline">{cups.country}</Badge>
      </div>

      <DetailRow icon={<MapPin />} label="Dirección">
        {cups.address ?? "Sin dirección"}
        {cups.city && `, ${cups.city}`}
        {cups.postal_code && ` (${cups.postal_code})`}
        {cups.province && `, ${cups.province}`}
      </DetailRow>

      <DetailRow icon={<Building />} label="Distribuidora">
        {cups.distributor_name ?? "No especificada"}
        {cups.distributor_code && (
          <span className="ml-1 text-muted-foreground">
            ({cups.distributor_code})
          </span>
        )}
      </DetailRow>

      <DetailRow icon={<Zap />} label="Tarifa de acceso">
        <span className="font-mono">
          {cups.tariff_access_code ?? "No especificada"}
        </span>
      </DetailRow>

      {powers.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">
            Potencias contratadas
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {powers.map((p) => (
              <div
                key={p.label}
                className="rounded-md border border-border bg-muted/30 p-2 text-center"
              >
                <span className="block text-xs text-muted-foreground">
                  {p.label}
                </span>
                <span className="text-sm font-medium">{p.value} kW</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {cups.sips_fetched_at && (
        <p className="text-xs text-muted-foreground">
          Última consulta SIPS:{" "}
          {new Date(cups.sips_fetched_at).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </>
  );
}

/** SIPS tab with refresh button. */
function SipsTab({ code }: { code: string }) {
  const [refresh, setRefresh] = useState(false);
  const sipsQuery = useSips(code, { refresh, enabled: true });

  const handleRefresh = () => {
    setRefresh(true);
    sipsQuery.refetch().then(() => {
      toast.success("Datos SIPS actualizados");
    }).catch(() => {
      toast.error("Error al consultar SIPS");
    });
  };

  if (sipsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (sipsQuery.isError) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <p className="text-sm text-destructive">Error al consultar SIPS</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={handleRefresh}>
          Reintentar
        </Button>
      </div>
    );
  }

  const sips = sipsQuery.data;
  if (!sips) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium">Datos SIPS</h4>
          {sips.cached && (
            <Badge variant="outline" className="text-xs">Cache</Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="mr-1.5 size-3.5" aria-hidden />
          Actualizar
        </Button>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
        <SipsField label="Distribuidora" value={sips.distributor_name} />
        <SipsField label="Cód. distribuidora" value={sips.distributor_code} />
        <SipsField label="Tarifa de acceso" value={sips.tariff_access_code} />
        <SipsField label="Dirección" value={sips.address} />
        <SipsField label="Ciudad" value={sips.city} />
        <SipsField label="Código postal" value={sips.postal_code} />
        <SipsField label="Provincia" value={sips.province} />
        <SipsField label="Consumo 12m" value={sips.consumption_12m_kwh ? `${sips.consumption_12m_kwh} kWh` : null} />
        {sips.fetched_at && (
          <SipsField
            label="Consultado"
            value={new Date(sips.fetched_at).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
        )}
      </div>

      {sips.contracted_power_kw && typeof sips.contracted_power_kw === "object" && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Potencias contratadas (SIPS)</h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(sips.contracted_power_kw).map(([key, val]) => (
              <div
                key={key}
                className="rounded-md border border-border bg-muted/30 p-2 text-center"
              >
                <span className="block text-xs uppercase text-muted-foreground">
                  {key}
                </span>
                <span className="text-sm font-medium">{String(val)} kW</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground [&_svg]:size-4" aria-hidden>
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{children}</p>
      </div>
    </div>
  );
}

function SipsField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">
        {value ?? <span className="text-muted-foreground">-</span>}
      </span>
    </div>
  );
}
