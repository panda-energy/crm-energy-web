/**
 * Helpers puros para el Pipeline Kanban (F-2.2).
 *
 * Aislados del JSX y de @dnd-kit para poder ejercitarlos con Vitest sin
 * mount. La capa de UI invoca `parseDragEvent` con los `active.id` /
 * `over.id` que @dnd-kit emite; este módulo decide la transición lógica.
 */
import type { Lead, LeadPage } from "@/lib/api/hooks/use-leads";

/**
 * Convención de IDs en @dnd-kit:
 *  - Cards (draggable): el `id` es el `lead.id` directamente (UUID).
 *  - Columnas (droppable): `id` con prefijo `stage:` + stage_id, para
 *    distinguir de las cards. Ej: `stage:44444444-4444-4444-4444-440000000001`.
 *
 * En sortable contexts, las cards también son droppables (acepta drop
 * antes/después de otra card). Cuando el `over.id` es un UUID puro,
 * resolvemos la columna leyendo `lead.stage_id` desde el mapa de cards.
 */
export const STAGE_DROPPABLE_PREFIX = "stage:" as const;

export function makeStageDroppableId(stageId: string): string {
  return `${STAGE_DROPPABLE_PREFIX}${stageId}`;
}

export function parseStageDroppableId(droppableId: string): string | null {
  return droppableId.startsWith(STAGE_DROPPABLE_PREFIX)
    ? droppableId.slice(STAGE_DROPPABLE_PREFIX.length)
    : null;
}

export interface ParsedDrop {
  leadId: string;
  fromStageId: string;
  toStageId: string;
  /**
   * ID de la card sobre la que se soltó (cuando aplica), para que el caller
   * pueda calcular `position` con `computeDropPosition`. `null` cuando se
   * soltó sobre la columna en sí (drop al final).
   */
  overCardId: string | null;
}

export interface DropEventInput {
  /** ID del elemento arrastrado (siempre un `lead.id`). */
  activeId: string;
  /**
   * ID del elemento sobre el que se soltó. Puede ser:
   *  - `stage:<stage_id>` cuando se suelta en una columna vacía o en su
   *    fondo.
   *  - El UUID de otra card cuando se suelta entre cards (sortable).
   */
  overId: string;
  /**
   * Mapa de `lead.id` → `stage.id` actual. Se usa para:
   *  1. Resolver `fromStageId` desde `activeId`.
   *  2. Resolver `toStageId` cuando `overId` es otra card.
   */
  leadStageById: ReadonlyMap<string, string>;
}

/**
 * Convierte un evento de @dnd-kit en una transición lógica.
 *
 * Devuelve `null` si:
 *  - El lead arrastrado no existe en el mapa (estado obsoleto).
 *  - El `overId` no resuelve a una columna válida.
 *  - La columna destino coincide con la origen (no-op).
 */
export function parseDropEvent(input: DropEventInput): ParsedDrop | null {
  const { activeId, overId, leadStageById } = input;
  const fromStageId = leadStageById.get(activeId);
  if (!fromStageId) return null;

  // Si overId es un stage droppable, lo extraemos directamente.
  const stageFromDroppable = parseStageDroppableId(overId);
  let toStageId: string | undefined;
  let overCardId: string | null = null;
  if (stageFromDroppable) {
    toStageId = stageFromDroppable;
  } else {
    // overId es probablemente otra card → resolver via mapa.
    toStageId = leadStageById.get(overId);
    overCardId = toStageId ? overId : null;
  }

  if (!toStageId) return null;
  if (toStageId === fromStageId) return null;

  return { leadId: activeId, fromStageId, toStageId, overCardId };
}

/**
 * Calcula la posición de inserción `position` que el backend espera en
 * `LeadMove.position` (cleanup wave).
 *
 * Convención semántica (espejada del backend):
 *  - **`null`** → "al final" (`position?: null` en el payload).
 *  - **`0`** → al principio del stage destino.
 *  - **`N` (1 ≤ N < len)** → entre la card `N-1` y la card `N`.
 *
 * Entradas:
 *  - `stageCards`: leads del stage destino **excluyendo** el lead arrastrado
 *    (el caller filtra antes para que el índice corresponda al destino post-
 *    drop). En orden de presentación (ya respetando `position`).
 *  - `overCardId`: ID de la card sobre la que se soltó; `null` si se soltó
 *    en una zona neutra del stage → "al final".
 *
 * Devuelve:
 *  - `null` si `overCardId` es `null` o no se encontró la card → backend
 *    lo trata como "al final".
 *  - Un entero `[0, len(stageCards)]` en otro caso.
 *
 * Notas:
 *  - El backend reordena el resto del stage automáticamente cuando recibe
 *    una `position` explícita; no necesitamos generar el resto del array.
 *  - Si el caller no provee `overCardId` (drop al final), devolvemos `null`
 *    → cualquier valor previo de position se sobrescribe en backend.
 */
export function computeDropPosition(
  stageCards: ReadonlyArray<{ id: string }>,
  overCardId: string | null,
): number | null {
  if (!overCardId) return null;
  const idx = stageCards.findIndex((c) => c.id === overCardId);
  if (idx < 0) return null;
  return idx;
}

// ── Optimistic helpers ──────────────────────────────────────────────────────

/**
 * Aplica un movimiento optimista a una página de leads: actualiza el
 * `stage_id` (y opcionalmente recalcula el `status` coarse). NO toca el
 * `total`. Devuelve siempre un objeto nuevo (immutable).
 */
export function applyOptimisticMoveToPage(
  page: LeadPage,
  leadId: string,
  toStageId: string,
  nextStatus?: Lead["status"],
): LeadPage {
  const idx = page.items.findIndex((l) => l.id === leadId);
  if (idx < 0) return page;
  const items = page.items.slice();
  const updated: Lead = {
    ...items[idx]!,
    stage_id: toStageId,
    status: nextStatus ?? items[idx]!.status,
    updated_at: new Date().toISOString(),
  };
  items[idx] = updated;
  return { ...page, items };
}

/**
 * Agrupa una lista de leads por su `stage_id`. Útil cuando se hace una
 * sola llamada con `pipeline_id` y el componente reparte cards por
 * columna en cliente. Conserva el orden del array recibido.
 */
export function groupLeadsByStage(
  leads: ReadonlyArray<Lead>,
): Map<string, Lead[]> {
  const out = new Map<string, Lead[]>();
  for (const lead of leads) {
    const list = out.get(lead.stage_id);
    if (list) list.push(lead);
    else out.set(lead.stage_id, [lead]);
  }
  return out;
}
