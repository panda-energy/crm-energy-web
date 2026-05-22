"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import {
  UserListPageSchema,
  type UserListItem,
  type UserListPage,
} from "../zod-schemas";
import type { components } from "../types";
import { useApiQuery } from "./use-api-query";

/**
 * Hooks tipados para el recurso User (cleanup wave: `GET /v1/users`).
 *
 * Endpoint paginado, filtros `q` (case-insensitive sobre email + nombre),
 * `role[]` y paginación clásica `limit` / `offset`. Lo consumen el filtro
 * "Propietario" del sidebar de leads y el bulk-action de asignar
 * propietario (sustituye al input UUID plano de Sprint 2 inicial).
 *
 * Deuda anotada (no es bug del cleanup, es scope futuro):
 *  - El backend no expone aún `GET /v1/users/{id}` individual; cuando lo
 *    haga se añade `useUser(id)` aquí. Mientras tanto, los consumidores
 *    derivan del cache de la lista (caller-side) o resuelven por nombre
 *    desde `useUsers({ q: id })` — no es eficiente, evitarlo.
 */

export interface UseUsersParams {
  q?: string;
  role?: components["schemas"]["UserRole"][];
  limit?: number;
  offset?: number;
}

export const usersQueryKeys = {
  all: ["/v1/users"] as const,
  list: (params: UseUsersParams = {}) => ["/v1/users", params] as const,
};

/**
 * Lista paginada de usuarios del tenant del usuario activo. El backend
 * filtra cross-tenant via RLS; el frontend no comprueba.
 *
 * - `staleTime: 60_000` (1 min): la lista cambia poco; tras un alta vía
 *   Clerk webhook el siguiente refetch la trae.
 */
export function useUsers(
  params: UseUsersParams = {},
): UseQueryResult<UserListPage, Error> {
  return useApiQuery("/v1/users", {
    // reason: el wrapper acepta `Record<string, primitive | undefined>`.
    // Los arrays (`role[]`) se serializan como `?role=admin&role=sales`,
    // que es lo que FastAPI espera.
    query: params as unknown as Record<
      string,
      string | number | boolean | undefined
    >,
    schema: UserListPageSchema,
    staleTime: 60_000,
  });
}

// Re-export del tipo principal para que los consumidores no crucen imports.
export type { UserListItem, UserListPage };
