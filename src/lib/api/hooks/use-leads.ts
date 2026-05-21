"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import type { components } from "../types";
import {
  ActivityListSchema,
  ActivitySchema,
  LeadBulkResultSchema,
  LeadPageSchema,
  LeadSchema,
  WhatsAppMessageSchema,
  type Activity,
  type ActivityCreate,
  type ActivityList,
  type Lead,
  type LeadBulkAction,
  type LeadBulkResult,
  type LeadCreate,
  type LeadMove,
  type LeadPage,
  type LeadUpdate,
  type WhatsAppMessage,
  type WhatsAppTemplateSend,
} from "../zod-schemas";
import { useApiQuery } from "./use-api-query";
import { useApiMutation } from "./use-api-mutation";

/**
 * Hooks tipados específicos del recurso Lead — Sprint 2 surface.
 *
 * Concentran:
 *  - El `path` correcto del OpenAPI (siempre con prefijo `/v1`).
 *  - El schema Zod de boundary validation correspondiente.
 *  - QueryKeys reutilizables (exportadas para invalidación selectiva en
 *    flujos cross-component).
 *  - `idempotencyKey: 'auto'` para mutaciones que el backend acepta
 *    (POST/PATCH/move/bulk) y **obligatoria** para WhatsApp send.
 */

export interface UseLeadsParams {
  statuses?: components["schemas"]["LeadStatus"][];
  sources?: components["schemas"]["LeadSource"][];
  owner_id?: string[];
  pipeline_id?: string[];
  stage_id?: string[];
  tag?: string[];
  created_from?: string;
  created_to?: string;
  q?: string;
  sort?: components["schemas"]["LeadSortField"];
  direction?: components["schemas"]["SortDirection"];
  limit?: number;
  offset?: number;
}

export const leadsQueryKeys = {
  all: ["/v1/leads"] as const,
  list: (params: UseLeadsParams = {}) =>
    ["/v1/leads", params] as const,
  detail: (leadId: string) => ["/v1/leads", leadId] as const,
  activities: (leadId: string) =>
    ["/v1/leads", leadId, "activities"] as const,
};

/**
 * Lista paginada de leads del tenant del usuario. Con boundary validation Zod.
 *
 * Filtros soportados por el backend (ver OpenAPI `list_leads`):
 *  - `statuses[]`, `sources[]`, `owner_id[]`, `pipeline_id[]`, `stage_id[]`,
 *    `tag[]` — todos AND-eados entre sí, OR dentro de cada lista.
 *  - `created_from` / `created_to` — ISO8601.
 *  - `q` — full-text case-insensitive contra nombre/email/teléfono/empresa.
 *  - `sort` + `direction` — orden seguro contra columna whitelisted.
 *  - `limit` (max 200) + `offset`.
 */
export function useLeads(
  params: UseLeadsParams = {},
): UseQueryResult<LeadPage, Error> {
  return useApiQuery("/v1/leads", {
    // reason: el wrapper acepta `Record<string, primitive | undefined>` y
    // tipa el query del path desde el OpenAPI; nuestros arrays se serializan
    // como `?statuses=new&statuses=qualified` que es lo que FastAPI espera.
    query: params as unknown as Record<string, string | number | boolean | undefined>,
    schema: LeadPageSchema,
  });
}

/**
 * Detalle de un lead. `leadId` puede ser `undefined` — en ese caso el query
 * queda en estado `enabled: false` para evitar requests con path vacío.
 */
export function useLead(
  leadId: string | undefined,
): UseQueryResult<Lead, Error> {
  return useApiQuery("/v1/leads/{lead_id}", {
    pathParams: leadId ? { lead_id: leadId } : undefined,
    schema: LeadSchema,
    enabled: Boolean(leadId),
  });
}

/**
 * Crear lead. Usa `idempotencyKey: 'auto'` (regla cross-skill #2). Invalida
 * la lista tras success.
 */
export function useCreateLead() {
  return useApiMutation<"/v1/leads", "post", typeof LeadSchema>("/v1/leads", {
    method: "POST",
    idempotencyKey: "auto",
    schema: LeadSchema,
    invalidates: [leadsQueryKeys.all],
  });
}

/**
 * Update parcial de un lead (PATCH). Soporta optimistic update — el caller
 * pasa la `OptimisticUpdate` apuntando a `leadsQueryKeys.detail(leadId)`.
 */
export function useUpdateLead(leadId: string) {
  return useApiMutation<"/v1/leads/{lead_id}", "patch", typeof LeadSchema>(
    "/v1/leads/{lead_id}",
    {
      method: "PATCH",
      pathParams: { lead_id: leadId },
      idempotencyKey: "auto",
      schema: LeadSchema,
      invalidates: [leadsQueryKeys.all, leadsQueryKeys.detail(leadId)],
    },
  );
}

/**
 * Soft-delete de un lead (DELETE → 204). El backend lo marca como eliminado
 * lógicamente; la cache de lista se invalida.
 */
export function useDeleteLead(leadId: string) {
  return useApiMutation<"/v1/leads/{lead_id}", "delete">(
    "/v1/leads/{lead_id}",
    {
      method: "DELETE",
      pathParams: { lead_id: leadId },
      idempotencyKey: "auto",
      invalidates: [leadsQueryKeys.all, leadsQueryKeys.detail(leadId)],
    },
  );
}

/**
 * Acción masiva (assign_owner / set_status / add_tags / remove_tags).
 * Backend acepta hasta 500 IDs por llamada.
 */
export function useBulkLeads() {
  return useApiMutation<
    "/v1/leads/bulk",
    "post",
    typeof LeadBulkResultSchema
  >("/v1/leads/bulk", {
    method: "POST",
    idempotencyKey: "auto",
    schema: LeadBulkResultSchema,
    invalidates: [leadsQueryKeys.all],
  });
}

/**
 * Mover un lead a otra etapa del mismo pipeline (4xx si el stage_id apunta
 * a otro pipeline). El backend registra automáticamente una actividad
 * `stage_changed` (+ `status_changed` si el bucket coarse cambia).
 */
export function useMoveLead(leadId: string) {
  return useApiMutation<
    "/v1/leads/{lead_id}/move",
    "post",
    typeof LeadSchema
  >("/v1/leads/{lead_id}/move", {
    method: "POST",
    pathParams: { lead_id: leadId },
    idempotencyKey: "auto",
    schema: LeadSchema,
    invalidates: [
      leadsQueryKeys.all,
      leadsQueryKeys.detail(leadId),
      leadsQueryKeys.activities(leadId),
    ],
  });
}

/**
 * Timeline de actividades de un lead (todas: manuales + sistema +
 * WhatsApp inbound/outbound). Paginado por `limit` + `offset`.
 */
export function useLeadActivities(
  leadId: string | undefined,
  params: { limit?: number; offset?: number } = {},
): UseQueryResult<ActivityList, Error> {
  return useApiQuery("/v1/leads/{lead_id}/activities", {
    pathParams: leadId ? { lead_id: leadId } : undefined,
    query: params,
    schema: ActivityListSchema,
    enabled: Boolean(leadId),
  });
}

/**
 * Añade una actividad manual (note / call / email). El backend rechaza
 * actividades de sistema (`stage_changed`, `whatsapp_*`, etc.) en este
 * endpoint — solo las crea él internamente.
 */
export function useCreateLeadActivity(leadId: string) {
  return useApiMutation<
    "/v1/leads/{lead_id}/activities",
    "post",
    typeof ActivitySchema
  >("/v1/leads/{lead_id}/activities", {
    method: "POST",
    pathParams: { lead_id: leadId },
    idempotencyKey: "auto",
    schema: ActivitySchema,
    invalidates: [
      leadsQueryKeys.activities(leadId),
      leadsQueryKeys.detail(leadId),
    ],
  });
}

/**
 * Envía un template WhatsApp pre-aprobado al lead.
 *
 * **Idempotency-Key es obligatorio** (lo exige el backend): el envío real
 * sale por la Meta Cloud API y un reintento sin la misma key duplicaría el
 * mensaje al cliente final. Si el caller no pasa una, el hook genera
 * `'auto'` y lanza advertencia en consola. Cualquier llamada con la misma
 * key + body diferente devuelve 409.
 *
 * El backend 503-ea cuando las credenciales WhatsApp del tenant no están
 * provisionadas — manejar en UI con un banner explicativo.
 */
export function useSendWhatsApp(
  leadId: string,
  options: { idempotencyKey?: string } = {},
) {
  // reason: WhatsApp send REQUIERE Idempotency-Key. Si el caller no la pasa,
  // generamos `'auto'` (UUIDv4 al construir la mutate-fn), que cumple con la
  // semántica idempotente solo si el caller no re-llama el hook con nueva key.
  // En UI crítica, el caller DEBE pasar una key estable persistida en estado.
  if (process.env.NODE_ENV !== "production" && !options.idempotencyKey) {
    console.warn(
      "[useSendWhatsApp] sin Idempotency-Key estable — usando 'auto'. " +
        "Para reintentos seguros, pasa una key explícita persistida en estado.",
    );
  }
  return useApiMutation<
    "/v1/leads/{lead_id}/whatsapp/send",
    "post",
    typeof WhatsAppMessageSchema
  >("/v1/leads/{lead_id}/whatsapp/send", {
    method: "POST",
    pathParams: { lead_id: leadId },
    idempotencyKey: options.idempotencyKey ?? "auto",
    schema: WhatsAppMessageSchema,
    invalidates: [
      leadsQueryKeys.activities(leadId),
      leadsQueryKeys.detail(leadId),
    ],
  });
}

// Re-exportamos los tipos para que los callers no tengan que cruzar imports.
export type {
  Activity,
  ActivityCreate,
  ActivityList,
  Lead,
  LeadBulkAction,
  LeadBulkResult,
  LeadCreate,
  LeadMove,
  LeadPage,
  LeadUpdate,
  WhatsAppMessage,
  WhatsAppTemplateSend,
};
