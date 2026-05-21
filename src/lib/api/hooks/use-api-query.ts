"use client";

import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";
import type { ZodTypeAny } from "zod";
import { apiGet, type ApiRequestOptions } from "../client";
import type { paths } from "../types";
import { useClerkApiContext } from "./clerk-context";

/**
 * useApiQuery — hook tipado contra los `paths` de OpenAPI.
 *
 * Garantías:
 *  1. **El path solo puede ser uno de los definidos en `paths`** (autocompleta
 *     `/auth/me`, `/leads`, `/leads/{leadId}`). Llamar a un path inventado es
 *     un error de tipo.
 *  2. **La queryKey deriva de `[path, params]`**, así dos llamadas al mismo
 *     recurso con distintos filtros NO se pisan en cache.
 *  3. **Multi-tenancy**: la tenantId del active organization de Clerk se
 *     inyecta automáticamente como `X-Tenant-Id` y entra en la queryKey,
 *     evitando que cambiar de organización muestre cache del tenant anterior.
 *  4. **Boundary validation**: si se pasa `schema`, la respuesta se valida
 *     con Zod ANTES de almacenarse en cache. Si la validación falla, el
 *     query entra en error con mensaje útil — el backend está rompiendo el
 *     contrato.
 *  5. **AbortSignal**: TanStack Query provee `signal`; lo propagamos al
 *     cliente para cancelar la request si el componente desmonta.
 *
 * Tipo de respuesta:
 *  - Por defecto se deriva de `paths[Path]["get"]["responses"][200]`.
 *  - Si se pasa `schema`, se sobrescribe con `z.infer<typeof schema>` —
 *    útil para narrow específico (e.g. Lead concreto vs. unión Lead | Problem).
 */

// Paths que tienen GET en el schema OpenAPI.
type GetPath = {
  [P in keyof paths]: paths[P] extends { get: unknown } ? P : never;
}[keyof paths];

// Respuesta 200 de un GET concreto.
type GetResponse<P extends GetPath> = paths[P]["get"] extends {
  responses: {
    200: {
      content: {
        "application/json": infer R;
      };
    };
  };
}
  ? R
  : never;

// Query params del path (si los hay).
type GetQuery<P extends GetPath> = paths[P]["get"] extends {
  parameters: { query?: infer Q };
}
  ? Q
  : undefined;

// Path params del path (si los hay).
type GetPathParams<P extends GetPath> = paths[P]["get"] extends {
  parameters: { path: infer Pp };
}
  ? Pp
  : undefined;

export interface UseApiQueryOptions<P extends GetPath, TSchema extends ZodTypeAny | undefined>
  extends Omit<
    UseQueryOptions<
      TSchema extends ZodTypeAny ? ReturnType<TSchema["parse"]> : GetResponse<P>,
      Error
    >,
    "queryKey" | "queryFn"
  > {
  /** Query params del recurso (ver OpenAPI schema). */
  query?: GetQuery<P>;
  /** Path params (e.g. `{ leadId: "..." }`) para rutas como `/leads/{leadId}`. */
  pathParams?: GetPathParams<P>;
  /** Schema Zod opcional para boundary validation. */
  schema?: TSchema;
  /** Headers adicionales (raro; útil para `If-None-Match` etc.). */
  headers?: Record<string, string>;
}

export function useApiQuery<
  P extends GetPath,
  TSchema extends ZodTypeAny | undefined = undefined,
>(
  path: P,
  options: UseApiQueryOptions<P, TSchema> = {},
): UseQueryResult<
  TSchema extends ZodTypeAny ? ReturnType<TSchema["parse"]> : GetResponse<P>,
  Error
> {
  const { getToken, tenantId } = useClerkApiContext();
  const { query, pathParams, schema, headers, ...queryOptions } = options;

  type TData = TSchema extends ZodTypeAny
    ? ReturnType<TSchema["parse"]>
    : GetResponse<P>;

  return useQuery<TData, Error>({
    // queryKey: tenantId primero para aislamiento de cache multi-tenant.
    queryKey: [path, tenantId, pathParams ?? null, query ?? null] as const,
    queryFn: async ({ signal }) => {
      const apiOpts: ApiRequestOptions = {
        getToken,
        tenantId,
        signal,
        headers,
      };
      if (query) {
        // reason: `query` viene tipado del OpenAPI como `{ page?: number; ... }`
        // pero el cliente acepta `Record<string, primitive | undefined>` que
        // es estructuralmente compatible. Convertimos sin perder safety.
        apiOpts.query = query as Record<string, string | number | boolean | undefined>;
      }
      if (pathParams) {
        apiOpts.pathParams = pathParams as Record<string, string | number>;
      }
      const response = await apiGet<unknown>(path, apiOpts);
      if (schema) {
        return schema.parse(response) as TData;
      }
      return response as TData;
    },
    ...queryOptions,
  });
}
