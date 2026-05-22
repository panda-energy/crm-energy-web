"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { MeOutSchema, type MeOut } from "../zod-schemas";
import { useApiQuery } from "./use-api-query";

/**
 * Hooks tipados para el recurso Auth/Me (cleanup wave:
 * `GET /v1/auth/me`).
 *
 * Devuelve `MeOut` con el perfil interno que respalda la sesión Clerk +
 * el `default_pipeline_id` del tenant (atajo: evita una llamada extra a
 * `/v1/pipelines` cuando el frontend hidrata el form de crear lead).
 *
 * Notas:
 *  - Si la sesión Clerk no tiene aún un user row interno (Clerk webhook
 *    no procesado), el endpoint devuelve 404 → el hook entra en error
 *    state. La UI debe degradar elegantemente (mostrar banner "perfil
 *    aún provisionándose") en lugar de bloquear.
 *  - `staleTime: 5min` — el perfil cambia poco; la `default_pipeline_id`
 *    podría cambiar si admin crea otra default, pero es operación rara.
 */

export const authQueryKeys = {
  me: ["/v1/auth/me"] as const,
};

export function useAuthMe(): UseQueryResult<MeOut, Error> {
  return useApiQuery("/v1/auth/me", {
    schema: MeOutSchema,
    staleTime: 5 * 60_000,
  });
}

/**
 * Conveniencia: devuelve el `default_pipeline_id` cuando esté disponible.
 * Útil para hidratar el form de crear lead sin forzar el caller a
 * destructurar `me?.default_pipeline_id` cada vez.
 *
 * Devuelve `null` si la query aún no resolvió o si el tenant no tiene
 * pipeline default sembrada todavía.
 */
export function useDefaultPipelineId(): string | null {
  const me = useAuthMe();
  return me.data?.default_pipeline_id ?? null;
}

export type { MeOut };
