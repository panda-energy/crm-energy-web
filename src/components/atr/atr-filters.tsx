"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type {
  AtrMessageType,
  AtrMessageStatus,
  AtrDistributor,
} from "@/lib/api/types-sprint4";

const MESSAGE_TYPES: { value: AtrMessageType; label: string }[] = [
  { value: "C1", label: "C1 - Cambio" },
  { value: "A3", label: "A3 - Alta" },
  { value: "B1", label: "B1 - Baja" },
  { value: "M1", label: "M1 - Modificacion" },
  { value: "R1", label: "R1 - Reclamacion" },
];

const STATUSES: { value: AtrMessageStatus; label: string }[] = [
  { value: "pending", label: "Pendiente" },
  { value: "sent", label: "Enviado" },
  { value: "ack_received", label: "ACK recibido" },
  { value: "processed", label: "Procesado" },
  { value: "rejected", label: "Rechazado" },
  { value: "timeout", label: "Timeout" },
];

const DISTRIBUTORS: { value: AtrDistributor; label: string }[] = [
  { value: "e-distribucion", label: "e-Distribucion" },
  { value: "i-de", label: "i-DE" },
  { value: "ufd", label: "UFD" },
  { value: "viesgo", label: "Viesgo" },
  { value: "begasa", label: "Begasa" },
];

export interface AtrFiltersState {
  q: string;
  messageType: AtrMessageType | "all";
  status: AtrMessageStatus | "all";
  distributor: AtrDistributor | "all";
}

interface AtrFiltersProps {
  filters: AtrFiltersState;
  onFiltersChange: (filters: AtrFiltersState) => void;
}

export function AtrFilters({ filters, onFiltersChange }: AtrFiltersProps) {
  const hasActiveFilters =
    filters.q ||
    filters.messageType !== "all" ||
    filters.status !== "all" ||
    filters.distributor !== "all";

  function handleClear() {
    onFiltersChange({
      q: "",
      messageType: "all",
      status: "all",
      distributor: "all",
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Buscar por CUPS..."
        value={filters.q}
        onChange={(e) =>
          onFiltersChange({ ...filters, q: e.target.value })
        }
        className="w-60"
        aria-label="Buscar por CUPS"
      />
      <Select
        value={filters.messageType}
        onValueChange={(v) =>
          onFiltersChange({
            ...filters,
            messageType: v as AtrMessageType | "all",
          })
        }
      >
        <SelectTrigger className="w-44" aria-label="Filtrar por tipo">
          <SelectValue placeholder="Tipo de mensaje" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos</SelectItem>
          {MESSAGE_TYPES.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.status}
        onValueChange={(v) =>
          onFiltersChange({
            ...filters,
            status: v as AtrMessageStatus | "all",
          })
        }
      >
        <SelectTrigger className="w-40" aria-label="Filtrar por estado">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.distributor}
        onValueChange={(v) =>
          onFiltersChange({
            ...filters,
            distributor: v as AtrDistributor | "all",
          })
        }
      >
        <SelectTrigger className="w-40" aria-label="Filtrar por distribuidora">
          <SelectValue placeholder="Distribuidora" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {DISTRIBUTORS.map((d) => (
            <SelectItem key={d.value} value={d.value}>
              {d.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="gap-1 text-muted-foreground"
        >
          <X className="size-3" aria-hidden />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
