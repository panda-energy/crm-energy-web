"use client";

import {
  ArrowRight,
  Bot,
  FileText,
  Layers,
  ListChecks,
  Mail,
  MessageSquare,
  Phone,
  RotateCcw,
  StickyNote,
  UserCog,
  Workflow,
} from "lucide-react";
import { useMemo, type ComponentType, type ReactNode } from "react";
import type { Activity, ActivityList } from "@/lib/api/hooks/use-leads";
import type { PipelineStage } from "@/lib/api/hooks/use-pipelines";
import type { UserListItem } from "@/lib/api/hooks/use-users";
import { LEAD_STATUS_LABELS } from "@/lib/leads/format";
import {
  formatAbsoluteTime,
  formatRelativeTime,
} from "@/lib/leads/relative-time";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Renderiza el timeline de actividades de un lead (F-2.4 + cleanup wave).
 *
 * Cleanup wave: el backend ahora emite `ActivityOut` como **unión
 * discriminada** por `type`. Sustituye al helper defensivo
 * `extractActivityDelta`: cada variante tiene su payload tipado y el switch
 * de abajo es exhaustivo (`unknown` actúa de fallback explícito).
 *
 * Resolución de nombres:
 *  - `stagesById` resuelve `from_stage_id` / `to_stage_id` → display name.
 *  - `usersById` resuelve `from_owner_id` / `to_owner_id` → display name.
 *    Si el caller no lo provee, mostramos UUIDs truncados.
 *
 * Vacío / cargando lo gestiona el caller (Sheet).
 */

const ICONS_BY_TYPE: Record<Activity["type"], ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  note: StickyNote,
  call: Phone,
  email: Mail,
  whatsapp_inbound: MessageSquare,
  whatsapp_outbound: MessageSquare,
  stage_changed: Workflow,
  status_changed: Workflow,
  owner_changed: UserCog,
  lead_created: FileText,
  restored: RotateCcw,
  bulk_action: ListChecks,
  system: Bot,
  unknown: Layers,
};

export interface LeadActivitiesListProps {
  activities: ActivityList | undefined;
  stagesById: Map<string, PipelineStage>;
  /**
   * Diccionario opcional de usuarios para resolver `from_owner_id` /
   * `to_owner_id` (y futuros `actor_user_id` con nombre). Si falta, las
   * actividades muestran UUIDs truncados — sigue siendo accesible pero
   * menos informativo.
   */
  usersById?: Map<string, UserListItem>;
  /** Filtra por tipo (`note` para la pestaña Notas, undefined para Actividades). */
  filterType?: Activity["type"];
  /** Estado de carga. */
  loading?: boolean;
}

export function LeadActivitiesList({
  activities,
  stagesById,
  usersById,
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
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
              aria-hidden
            >
              <Icon className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <ActivityTitle
                activity={act}
                stagesById={stagesById}
                usersById={usersById}
              />
              <ActivityBody activity={act} />
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

/**
 * Encabezado tipado por discriminator. Switch exhaustivo — TS verifica
 * que cubrimos las 13 variantes.
 */
function ActivityTitle({
  activity,
  stagesById,
  usersById,
}: {
  activity: Activity;
  stagesById: Map<string, PipelineStage>;
  usersById?: Map<string, UserListItem>;
}) {
  const title: ReactNode = (() => {
    switch (activity.type) {
      case "note":
        return "Nota";
      case "call": {
        const out = activity.payload.outcome;
        return out ? `Llamada · ${out}` : "Llamada";
      }
      case "email": {
        const subj = activity.payload.subject;
        return subj ? `Email · ${subj}` : "Email";
      }
      case "whatsapp_inbound":
        return "WhatsApp recibido";
      case "whatsapp_outbound":
        return "WhatsApp enviado";
      case "stage_changed": {
        const { from_stage_id, from_stage_name, to_stage_id, to_stage_name } =
          activity.payload;
        const fromName =
          from_stage_name ??
          (from_stage_id
            ? (stagesById.get(from_stage_id)?.name ?? from_stage_id.slice(0, 6))
            : "—");
        const toName =
          to_stage_name ??
          stagesById.get(to_stage_id)?.name ??
          to_stage_id.slice(0, 6);
        return (
          <span className="inline-flex flex-wrap items-center gap-1">
            Etapa: <strong>{fromName}</strong>
            <ArrowRight className="size-3" aria-hidden />
            <strong>{toName}</strong>
          </span>
        );
      }
      case "status_changed": {
        const { from_status, to_status } = activity.payload;
        const fromLabel = from_status
          ? (LEAD_STATUS_LABELS[
              from_status as keyof typeof LEAD_STATUS_LABELS
            ] ?? from_status)
          : "—";
        const toLabel =
          LEAD_STATUS_LABELS[to_status as keyof typeof LEAD_STATUS_LABELS] ??
          to_status;
        return (
          <span className="inline-flex flex-wrap items-center gap-1">
            Estado: <strong>{fromLabel}</strong>
            <ArrowRight className="size-3" aria-hidden />
            <strong>{toLabel}</strong>
          </span>
        );
      }
      case "owner_changed": {
        const { from_owner_id, to_owner_id } = activity.payload;
        const renderOwner = (id: string | null | undefined) => {
          if (!id) return <em>Sin asignar</em>;
          const u = usersById?.get(id);
          if (u?.name) return <strong>{u.name}</strong>;
          if (u?.email) return <strong>{u.email}</strong>;
          return (
            <span className="font-mono text-xs">{id.slice(0, 8)}…</span>
          );
        };
        return (
          <span className="inline-flex flex-wrap items-center gap-1">
            Propietario: {renderOwner(from_owner_id)}
            <ArrowRight className="size-3" aria-hidden />
            {renderOwner(to_owner_id)}
          </span>
        );
      }
      case "lead_created": {
        const src = activity.payload.source;
        return src ? `Lead creado · origen ${src}` : "Lead creado";
      }
      case "restored":
        return "Lead restaurado";
      case "bulk_action": {
        const a = activity.payload.action;
        return `Acción masiva · ${a}`;
      }
      case "system":
        return "Evento del sistema";
      case "unknown":
        return "Evento desconocido";
    }
  })();
  return <p className="text-xs font-medium text-foreground">{title}</p>;
}

/**
 * Cuerpo opcional debajo del título — varía por tipo y usa el payload
 * tipado (sin lecturas defensivas).
 */
function ActivityBody({ activity }: { activity: Activity }) {
  switch (activity.type) {
    case "note": {
      const body = activity.payload.body ?? activity.summary;
      if (!body) return null;
      // Notas suelen ser breves; renderizamos como párrafo plano. Cuando
      // backend exponga markdown sanitizado se conmuta a renderer.
      return <p className="whitespace-pre-line text-sm text-foreground">{body}</p>;
    }
    case "call": {
      const dur = activity.payload.duration_sec;
      const summary = activity.summary;
      const parts: string[] = [];
      if (dur != null) parts.push(`${Math.floor(dur / 60)}m ${dur % 60}s`);
      if (summary) parts.push(summary);
      if (parts.length === 0) return null;
      return <p className="text-sm text-foreground">{parts.join(" · ")}</p>;
    }
    case "email": {
      const body = activity.payload.body ?? activity.summary;
      if (!body) return null;
      return <p className="line-clamp-3 text-sm text-foreground">{body}</p>;
    }
    case "whatsapp_inbound":
    case "whatsapp_outbound": {
      const text = activity.payload.text ?? activity.summary;
      if (!text) return null;
      const isInbound = activity.type === "whatsapp_inbound";
      return (
        <p
          className={
            isInbound
              ? "rounded-md bg-muted/60 px-3 py-2 text-sm text-foreground"
              : "rounded-md bg-brand/10 px-3 py-2 text-sm text-foreground"
          }
        >
          {text}
        </p>
      );
    }
    case "stage_changed":
      if (!activity.payload.note) return null;
      return (
        <p className="text-sm italic text-muted-foreground">
          “{activity.payload.note}”
        </p>
      );
    case "bulk_action": {
      const params = activity.payload.params;
      if (!params || Object.keys(params).length === 0) return null;
      return (
        <p className="font-mono text-[11px] text-muted-foreground">
          {JSON.stringify(params)}
        </p>
      );
    }
    case "restored":
      if (!activity.payload.restored_from) return null;
      return (
        <p className="text-xs text-muted-foreground">
          Restaurado desde {formatAbsoluteTime(activity.payload.restored_from)}
        </p>
      );
    case "system":
      return activity.summary ? (
        <p className="text-sm text-foreground">{activity.summary}</p>
      ) : null;
    case "unknown":
      return (
        <p className="text-xs text-muted-foreground">
          Tipo de evento sin soporte en este cliente. Actualizar app para
          verlo correctamente.
        </p>
      );
    case "status_changed":
    case "owner_changed":
    case "lead_created":
      // El título ya muestra la transición; summary suele estar vacío.
      return activity.summary ? (
        <p className="text-sm text-foreground">{activity.summary}</p>
      ) : null;
  }
}
