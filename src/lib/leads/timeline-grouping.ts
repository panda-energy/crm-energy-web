/**
 * Helpers puros para la vista Timeline de leads (F-2.3).
 *
 * Aislados del JSX para que sean testeables sin mount (Vitest unit). Estas
 * funciones NO dependen de React, TanStack Query ni Clerk.
 *
 * Convenciones:
 *  - Mes formateado en `es` con date-fns (capitalizado) — "Mayo 2026".
 *  - `monthKey` es `YYYY-MM` y es la clave de identidad/orden del grupo.
 *  - Orden cronológico **inverso**: el grupo más reciente primero, y
 *    dentro de cada grupo los leads más recientes primero
 *    (por `last_contacted_at` o, en su defecto, `updated_at`).
 *  - Si un lead no tiene `last_contacted_at`, se usa `updated_at`. Si
 *    no tiene ninguno, cae a `created_at` (siempre presente).
 */
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { Lead } from "@/lib/api/hooks/use-leads";

/** Días desde "hoy" en UTC, redondeado hacia abajo. */
function daysSince(iso: string | null | undefined, now: Date = new Date()): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return Number.POSITIVE_INFINITY;
  const diff = now.getTime() - ts;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Fecha de referencia para agrupar — preferimos `last_contacted_at` (qué hicimos
 *  recientemente con el lead), luego `updated_at`, luego `created_at`. */
export function referenceDateForGrouping(lead: Lead): string {
  return lead.last_contacted_at ?? lead.updated_at ?? lead.created_at;
}

export interface LeadTimelineGroup {
  /** Clave estable "YYYY-MM" — útil como `key` de React. */
  monthKey: string;
  /** Etiqueta humana capitalizada en `es` — "Mayo 2026". */
  label: string;
  /** Leads del grupo, ordenados desc por la fecha de referencia. */
  leads: Lead[];
}

/**
 * Agrupa una lista de leads por mes (basado en `last_contacted_at`/`updated_at`
 * /`created_at`) y devuelve los grupos ordenados del más reciente al más
 * antiguo. Dentro de cada grupo, los leads van también desc.
 *
 * Si la lista viene vacía, devuelve `[]` — el caller decide qué mostrar.
 */
export function groupLeadsByMonth(leads: Lead[]): LeadTimelineGroup[] {
  const groupsMap = new Map<string, LeadTimelineGroup>();

  for (const lead of leads) {
    const refIso = referenceDateForGrouping(lead);
    let date: Date;
    try {
      date = parseISO(refIso);
      if (Number.isNaN(date.getTime())) continue;
    } catch {
      continue;
    }
    const monthKey = `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
    let group = groupsMap.get(monthKey);
    if (!group) {
      // reason: date-fns con locale es devuelve el mes en minúsculas
      // ("mayo 2026"). Capitalizamos manualmente — sin librería extra.
      const raw = format(date, "LLLL yyyy", { locale: es });
      const label = raw.charAt(0).toUpperCase() + raw.slice(1);
      group = { monthKey, label, leads: [] };
      groupsMap.set(monthKey, group);
    }
    group.leads.push(lead);
  }

  // Sort within each group: ref desc.
  for (const group of groupsMap.values()) {
    group.leads.sort((a, b) => {
      const ta = Date.parse(referenceDateForGrouping(a));
      const tb = Date.parse(referenceDateForGrouping(b));
      return tb - ta;
    });
  }

  // Sort groups: monthKey desc lex-sort works because "YYYY-MM" is fixed-width.
  return Array.from(groupsMap.values()).sort((a, b) =>
    a.monthKey < b.monthKey ? 1 : a.monthKey > b.monthKey ? -1 : 0,
  );
}

export type StagnationLevel = "none" | "stale_contact" | "stagnant";

export interface StagnationBadge {
  level: StagnationLevel;
  /** Texto a renderizar en el badge. `null` si `level === 'none'`. */
  label: string | null;
  /** Variante semántica del badge — el caller la pasa al `<Badge>`. */
  variant: "destructive" | "warning" | null;
}

/**
 * Calcula el badge de estancamiento para un lead.
 *
 * Reglas (consensuadas con producto):
 *
 *  - **stale_contact** (rojo claro): `last_contacted_at` existe y han pasado
 *    > 14 días desde ese contacto. Texto: "Sin contacto X días".
 *  - **stagnant** (naranja): `created_at` > 30 días Y `status` ∈ {`new`,
 *    `contacted`}. Texto: "Estancado". Tiene prioridad SOBRE stale_contact
 *    cuando ambas aplican — la señal "el lead nunca avanza" es más fuerte
 *    que "hace tiempo que no le hablamos".
 *  - **none**: el resto (sigue avanzando o todavía es reciente).
 *
 * Para leads sin `last_contacted_at`, NO mostramos stale_contact (no había
 * contacto que estuviera "viejo"). El badge "Estancado" sí aplica si la edad
 * del lead supera el umbral.
 */
export function computeStagnationBadge(
  lead: Pick<Lead, "status" | "created_at" | "last_contacted_at">,
  now: Date = new Date(),
): StagnationBadge {
  const ageDays = daysSince(lead.created_at, now);
  const sinceContactDays = daysSince(lead.last_contacted_at, now);

  const isStagnant =
    ageDays > 30 && (lead.status === "new" || lead.status === "contacted");
  if (isStagnant) {
    return { level: "stagnant", label: "Estancado", variant: "warning" };
  }

  if (lead.last_contacted_at && sinceContactDays > 14) {
    return {
      level: "stale_contact",
      label: `Sin contacto ${sinceContactDays} ${sinceContactDays === 1 ? "día" : "días"}`,
      variant: "destructive",
    };
  }

  return { level: "none", label: null, variant: null };
}
