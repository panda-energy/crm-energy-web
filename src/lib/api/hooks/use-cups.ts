"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import type { components } from "../types";
import {
  CupsPageSchema,
  CupsSchema,
  SipsResponseSchema,
  type Cups,
  type CupsCreate,
  type CupsPage,
  type CupsUpdate,
  type SipsResponse,
} from "../zod-schemas";
import { useApiQuery } from "./use-api-query";
import { useApiMutation } from "./use-api-mutation";

/**
 * Hooks tipados para el recurso CUPS (Sprint 3).
 *
 * Endpoints cubiertos:
 *  - GET /v1/cups (lista paginada + filtros)
 *  - GET /v1/cups/{cups_id} (detalle)
 *  - POST /v1/cups (crear)
 *  - PATCH /v1/cups/{cups_id} (actualizar)
 *  - DELETE /v1/cups/{cups_id} (eliminar)
 *  - GET /v1/cups/{code}/sips (consulta SIPS CNMC)
 */

export interface UseCupsParams {
  q?: string;
  status?: components["schemas"]["CupsStatus"][];
  energy_type?: components["schemas"]["EnergyType"];
  distributor_code?: string;
  tariff_access_code?: string;
  limit?: number;
  offset?: number;
}

export const cupsQueryKeys = {
  all: ["/v1/cups"] as const,
  list: (params: UseCupsParams = {}) => ["/v1/cups", params] as const,
  detail: (cupsId: string) => ["/v1/cups", cupsId] as const,
  sips: (code: string) => ["/v1/cups", code, "sips"] as const,
};

/** Lista paginada de CUPS del tenant. */
export function useCups(
  params: UseCupsParams = {},
): UseQueryResult<CupsPage, Error> {
  return useApiQuery("/v1/cups", {
    // reason: arrays se serializan como `?status=draft&status=active`
    query: params as unknown as Record<string, string | number | boolean | undefined>,
    schema: CupsPageSchema,
  });
}

/** Detalle de un CUPS. */
export function useCup(
  cupsId: string | undefined,
): UseQueryResult<Cups, Error> {
  return useApiQuery("/v1/cups/{cups_id}", {
    pathParams: cupsId ? { cups_id: cupsId } : undefined,
    schema: CupsSchema,
    enabled: Boolean(cupsId),
  });
}

/** Crear CUPS. */
export function useCreateCup() {
  return useApiMutation<"/v1/cups", "post", typeof CupsSchema>("/v1/cups", {
    method: "POST",
    idempotencyKey: "auto",
    schema: CupsSchema,
    invalidates: [cupsQueryKeys.all],
  });
}

/** Actualizar CUPS. */
export function useUpdateCup(cupsId: string) {
  return useApiMutation<"/v1/cups/{cups_id}", "patch", typeof CupsSchema>(
    "/v1/cups/{cups_id}",
    {
      method: "PATCH",
      pathParams: { cups_id: cupsId },
      idempotencyKey: "auto",
      schema: CupsSchema,
      invalidates: [cupsQueryKeys.all, cupsQueryKeys.detail(cupsId)],
    },
  );
}

/** Eliminar CUPS. */
export function useDeleteCup(cupsId: string) {
  return useApiMutation<"/v1/cups/{cups_id}", "delete">(
    "/v1/cups/{cups_id}",
    {
      method: "DELETE",
      pathParams: { cups_id: cupsId },
      idempotencyKey: "auto",
      invalidates: [cupsQueryKeys.all, cupsQueryKeys.detail(cupsId)],
    },
  );
}

/**
 * Consulta SIPS del CNMC para un CUPS por su code.
 * Usa `useApiQuery` con `enabled: false` — se activa manualmente con `refetch()`.
 */
export function useSips(
  code: string | undefined,
  options: { refresh?: boolean; enabled?: boolean } = {},
): UseQueryResult<SipsResponse, Error> {
  return useApiQuery("/v1/cups/{code}/sips", {
    pathParams: code ? { code } : undefined,
    query: options.refresh ? { refresh: true } : undefined,
    schema: SipsResponseSchema,
    enabled: options.enabled ?? Boolean(code),
  });
}

// Re-exports for callers
export type {
  Cups,
  CupsCreate,
  CupsPage,
  CupsUpdate,
  SipsResponse,
};
