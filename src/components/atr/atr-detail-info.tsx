"use client";

import type { AtrMessage } from "@/lib/api/types-sprint4";

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

const DISTRIBUTOR_LABELS: Record<string, string> = {
  "e-distribucion": "e-Distribucion",
  "i-de": "i-DE",
  ufd: "UFD",
  viesgo: "Viesgo",
  begasa: "Begasa",
};

interface AtrDetailInfoProps {
  message: AtrMessage;
}

interface InfoRowProps {
  label: string;
  value: string | number | null;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">
        {value ?? "-"}
      </dd>
    </div>
  );
}

export function AtrDetailInfo({ message }: AtrDetailInfoProps) {
  return (
    <dl className="divide-y divide-border">
      <InfoRow label="CUPS" value={message.cups_code} />
      <InfoRow
        label="Distribuidora"
        value={DISTRIBUTOR_LABELS[message.distributor] ?? message.distributor}
      />
      <InfoRow label="Contrato" value={message.contract_id} />
      <InfoRow label="ID externo" value={message.external_id} />
      <InfoRow label="Version XSD" value={message.xsd_version} />
      <InfoRow
        label="Reintentos"
        value={`${message.retry_count} / ${message.max_retries}`}
      />
      {message.last_error && (
        <div className="py-2">
          <dt className="text-sm text-muted-foreground">Ultimo error</dt>
          <dd className="mt-1 rounded-md bg-red-50 p-2 text-xs text-red-800 dark:bg-red-900/20 dark:text-red-300">
            {message.last_error}
          </dd>
        </div>
      )}
      <InfoRow label="Creado" value={formatDate(message.created_at)} />
      <InfoRow label="Enviado" value={formatDate(message.sent_at)} />
      <InfoRow label="ACK recibido" value={formatDate(message.ack_at)} />
      <InfoRow label="Procesado" value={formatDate(message.processed_at)} />
      <InfoRow label="Actualizado" value={formatDate(message.updated_at)} />
    </dl>
  );
}
