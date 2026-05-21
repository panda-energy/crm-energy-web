import type { Activity } from "@/lib/api/hooks/use-leads";

/**
 * Extrae el delta semántico del payload de actividades de sistema.
 *
 * El backend emite actividades de tipo `stage_changed`, `status_changed`,
 * `owner_changed`, etc. con un `payload: Record<string, unknown>`. El
 * contrato exacto del payload **no está tipado en el OpenAPI** (deuda
 * backend documentada). Aquí hacemos extracción defensiva: si el shape
 * cambia, devolvemos `null` en lugar de explotar.
 *
 * El consumidor de UI usa `from_stage_id` / `to_stage_id` para resolver
 * a nombres legibles via `usePipelineStages()`.
 */

export interface StageChangedDelta {
  type: "stage_changed";
  fromStageId: string | null;
  toStageId: string | null;
  note: string | null;
}

export interface StatusChangedDelta {
  type: "status_changed";
  fromStatus: string | null;
  toStatus: string | null;
}

export interface OwnerChangedDelta {
  type: "owner_changed";
  fromOwnerId: string | null;
  toOwnerId: string | null;
}

export type ActivityDelta =
  | StageChangedDelta
  | StatusChangedDelta
  | OwnerChangedDelta
  | null;

function readString(
  payload: Record<string, unknown>,
  key: string,
): string | null {
  const v = payload[key];
  if (typeof v === "string" && v.length > 0) return v;
  return null;
}

export function extractActivityDelta(activity: Activity): ActivityDelta {
  const payload = activity.payload;
  if (!payload || typeof payload !== "object") return null;
  if (activity.type === "stage_changed") {
    return {
      type: "stage_changed",
      fromStageId: readString(payload, "from_stage_id"),
      toStageId: readString(payload, "to_stage_id"),
      note: readString(payload, "note"),
    };
  }
  if (activity.type === "status_changed") {
    return {
      type: "status_changed",
      fromStatus: readString(payload, "from_status"),
      toStatus: readString(payload, "to_status"),
    };
  }
  if (activity.type === "owner_changed") {
    return {
      type: "owner_changed",
      fromOwnerId: readString(payload, "from_owner_id"),
      toOwnerId: readString(payload, "to_owner_id"),
    };
  }
  return null;
}
