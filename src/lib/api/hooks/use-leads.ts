"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import type { components } from "../types";
import {
  LeadPageSchema,
  LeadSchema,
  type Lead,
  type LeadCreate,
  type LeadPage,
} from "../zod-schemas";
import { useApiQuery } from "./use-api-query";
import { useApiMutation } from "./use-api-mutation";

/**
 * Hooks tipados específicos del recurso Lead.
 *
 * Pensados para que el equipo del Sprint 2 importe directamente sin tener
 * que recordar paths o schemas. Concentran:
 *  - El `path` correcto del OpenAPI.
 *  - El schema Zod de boundary validation correspondiente.
 *  - QueryKeys reutilizables (exportadas para invalidación selectiva en
 *    flujos cross-component).
 *  - Por defecto, los POST usan `idempotencyKey: 'auto'` para cumplir la
 *    regla cross-skill #2.
 */

export const leadsQueryKeys = {
  all: ["/leads"] as const,
  list: (params?: components["schemas"]["LeadStatus"] | { status?: components["schemas"]["LeadStatus"]; page?: number; pageSize?: number }) =>
    ["/leads", params ?? null] as const,
  detail: (leadId: string) => ["/leads/{leadId}", { leadId }] as const,
};

export interface UseLeadsParams {
  page?: number;
  pageSize?: number;
  status?: components["schemas"]["LeadStatus"];
}

/**
 * Lista paginada de leads del tenant del usuario. Con boundary validation Zod.
 */
export function useLeads(params: UseLeadsParams = {}): UseQueryResult<LeadPage, Error> {
  return useApiQuery("/leads", {
    query: params,
    schema: LeadPageSchema,
  });
}

/**
 * Detalle de un lead. `leadId` puede ser `undefined` — en ese caso el query
 * queda en estado `enabled: false` para evitar requests con path vacío.
 */
export function useLead(leadId: string | undefined): UseQueryResult<Lead, Error> {
  return useApiQuery("/leads/{leadId}", {
    pathParams: leadId ? { leadId } : undefined,
    schema: LeadSchema,
    enabled: Boolean(leadId),
  });
}

/**
 * Crear lead. Usa `idempotencyKey: 'auto'` para cumplir regla cross-skill #2
 * (mutaciones críticas con Idempotency-Key). Invalida la lista tras success.
 */
export function useCreateLead() {
  return useApiMutation<"/leads", "post", typeof LeadSchema>("/leads", {
    method: "POST",
    idempotencyKey: "auto",
    schema: LeadSchema,
    invalidates: [leadsQueryKeys.all],
  });
}

// Re-exportamos los tipos para que los callers no tengan que cruzar imports.
export type { Lead, LeadCreate, LeadPage };
