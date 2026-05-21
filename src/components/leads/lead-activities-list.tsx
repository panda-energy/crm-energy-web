"use client";

import {
  ArrowRight,
  Bot,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  StickyNote,
  UserCog,
  Workflow,
} from "lucide-react";
import { useMemo, type ReactNode } from "react";
import type { Activity, ActivityList } from "@/lib/api/hooks/use-leads";
import type { PipelineStage } from "@/lib/api/hooks/use-pipelines";
import { extractActivityDelta } from "@/lib/leads/activity-delta";
import { LEAD_STATUS_LABELS } from "@/lib/leads/format";
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/leads/relative-time";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Renderiza el timeline de actividades de un lead (F-2.4 — pestaña
 * Actividades / Notas).
 *
 * Para `stage_changed`/`status_changed`, resuelve los UUIDs vía
 * `stagesById` y muestra "Stage A → Stage B" (o el delta de status).
 *
 * Vacío: renderiza un mensaje neutro. Error/cargando lo gestiona el
 * caller (Sheet) con sus propios estados.
 */

const ICONS_BY_TYPE: Record<Activity["type"], React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  note: StickyNote,
  call: Phone,
  email: Mail,
  whatsapp_inbound: MessageSquare,
  whatsapp_outbound: MessageSquare,
  stage_changed: Workflow,
  status_changed: Workflow,
  owner_changed: UserCog,
  lead_created: FileText,
  system: Bot,
};

export interface LeadActivitiesListProps {
  activities: ActivityList | undefined;
  stagesById: Map<string, PipelineStage>;
  /** Filtra por tipo (`note` para la pestaña Notas, undefined para Actividades). */
  filterType?: Activity["type"];
  /** Estado de carga. */
  loading?: boolean;
}

export function LeadActivitiesList({
  activities,
  stagesById,
  filterType,
  loading,
}: LeadActivitiesListProps) {
  const filtered = useMemo(() => {
    if (!activities) return [];
    if (!filterType) return activities;
    return activities.filter((a) => a.type === filterType);
  }, [activities, filterType]);

  if (loading) {
    return (
      <ul className="space-y-3">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex gap-3">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (filtered.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border bg-surface/40 px-4 py-6 text-center text-sm text-muted-foreground">
        {filterType === "note"
          ? "Aún no hay notas. Añade la primera abajo."
          : "Aún no hay actividades para este lead."}
      </p>
    );
  }

  return (
    <ul className="space-y-3" role="list" aria-label="Actividades del lead">
      {filtered.map((act) => {
        const Icon = ICONS_BY_TYPE[act.type] ?? Bot;
        return (
          <li
            key={act.id}
            className="flex gap-3 rounded-md border border-border bg-surface/30 px-3 py-2"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Icon className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <ActivityTitle activity={act} stagesById={stagesById} />
              {act.summary ? (
                <p className="text-sm text-foreground">{act.summary}</p>
              ) : null}
              <p
                className="text-xs text-muted-foreground"
                title={formatAbsoluteTime(act.occurred_at)}
              >
                {formatRelativeTime(act.occurred_at)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ActivityTitle({
  activity,
  stagesById,
}: {
  activity: Activity;
  stagesById: Map<string, PipelineStage>;
}) {
  const titleText: ReactNode = (() => {
    switch (activity.type) {
      case "note":
        return "Nota";
      case "call":
        return "Llamada";
      case "email":
        return "Email";
      case "whatsapp_inbound":
        return "WhatsApp recibido";
      case "whatsapp_outbound":
        return "WhatsApp enviado";
      case "lead_created":
        return "Lead creado";
      case "system":
        return "Sistema";
      case "stage_changed": {
        const delta = extractActivityDelta(activity);
        if (delta && delta.type === "stage_changed") {
          const fromName = delta.fromStageId
            ? (stagesById.get(delta.fromStageId)?.name ?? delta.fromStageId.slice(0, 6))
            : "—";
          const toName = delta.toStageId
            ? (stagesById.get(delta.toStageId)?.name ?? delta.toStageId.slice(0, 6))
            : "—";
          return (
            <span className="inline-flex items-center gap-1">
              Etapa: {fromName} <ArrowRight className="size-3" aria-hidden /> {toName}
            </span>
          );
        }
        return "Cambio de etapa";
      }
      case "status_changed": {
        const delta = extractActivityDelta(activity);
        if (delta && delta.type === "status_changed") {
          const from = delta.fromStatus
            ? (LEAD_STATUS_LABELS[delta.fromStatus as keyof typeof LEAD_STATUS_LABELS] ?? delta.fromStatus)
            : "—";
          const to = delta.toStatus
            ? (LEAD_STATUS_LABELS[delta.toStatus as keyof typeof LEAD_STATUS_LABELS] ?? delta.toStatus)
            : "—";
          return (
            <span className="inline-flex items-center gap-1">
              Estado: {from} <ArrowRight className="size-3" aria-hidden /> {to}
            </span>
          );
        }
        return "Cambio de estado";
      }
      case "owner_changed":
        return "Cambio de propietario";
      default:
        return activity.type;
    }
  })();

  return <p className="text-xs font-medium text-foreground">{titleText}</p>;
}
