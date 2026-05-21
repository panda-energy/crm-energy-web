"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { UseLeadsParams } from "@/lib/api/hooks/use-leads";
import type { components } from "@/lib/api/types";

/**
 * Bridge entre `searchParams` de Next App Router y la forma de filtros que
 * espera `useLeads`.
 *
 * Convención de serialización (compatible con FastAPI):
 *  - Listas: claves repetidas (`?statuses=new&statuses=qualified`).
 *  - Strings simples (`q`, `created_from`, …): `?q=foo`.
 *  - `limit`/`offset`/`sort`/`direction`: igual, valores string.
 *
 * Las claves usadas en URL coinciden con las del backend (`statuses`,
 * `sources`, `owner_id`, `pipeline_id`, `stage_id`, `tag`, `q`, `sort`,
 * `direction`, `created_from`, `created_to`, `limit`, `offset`) para que
 * compartir un link "pegue" exactamente con el backend.
 *
 * `updateFilters` hace merge (no replace) — preserva el resto de la URL,
 * útil cuando otro componente añade un query param ajeno.
 */
export type LeadStatus = components["schemas"]["LeadStatus"];
export type LeadSource = components["schemas"]["LeadSource"];
export type LeadSortField = components["schemas"]["LeadSortField"];
export type SortDirection = components["schemas"]["SortDirection"];

const LIST_KEYS = [
  "statuses",
  "sources",
  "owner_id",
  "pipeline_id",
  "stage_id",
  "tag",
] as const;

const SINGLE_KEYS = [
  "q",
  "created_from",
  "created_to",
  "sort",
  "direction",
  "limit",
  "offset",
] as const;

type ListKey = (typeof LIST_KEYS)[number];
type SingleKey = (typeof SINGLE_KEYS)[number];

export interface LeadsFiltersInput {
  statuses?: LeadStatus[];
  sources?: LeadSource[];
  owner_id?: string[];
  pipeline_id?: string[];
  stage_id?: string[];
  tag?: string[];
  q?: string;
  created_from?: string;
  created_to?: string;
  sort?: LeadSortField;
  direction?: SortDirection;
  limit?: number;
  offset?: number;
}

/** Parsea los searchParams a la forma `UseLeadsParams`. */
export function parseLeadsParams(
  sp: URLSearchParams,
): UseLeadsParams {
  const out: UseLeadsParams = {};
  for (const key of LIST_KEYS) {
    const values = sp.getAll(key);
    if (values.length > 0) {
      // reason: las listas vienen como strings; los enums los tipa el caller.
      (out as Record<string, unknown>)[key] = values;
    }
  }
  const q = sp.get("q");
  if (q) out.q = q;
  const cf = sp.get("created_from");
  if (cf) out.created_from = cf;
  const ct = sp.get("created_to");
  if (ct) out.created_to = ct;
  const sort = sp.get("sort");
  if (sort) out.sort = sort as LeadSortField;
  const direction = sp.get("direction");
  if (direction) out.direction = direction as SortDirection;
  const limit = sp.get("limit");
  if (limit) {
    const n = Number(limit);
    if (Number.isFinite(n) && n > 0) out.limit = n;
  }
  const offset = sp.get("offset");
  if (offset) {
    const n = Number(offset);
    if (Number.isFinite(n) && n >= 0) out.offset = n;
  }
  return out;
}

/**
 * Hook que expone los filtros activos + un updater que muta la URL.
 *
 * - `params`: lo que pasarías directo a `useLeads(params)`.
 * - `updateFilters(patch)`: merge superficial sobre los actuales.
 * - `clearFilters()`: vacía todos excepto `limit` (preserva preferencia
 *   de paginación de la sesión).
 *
 * Usa `router.replace({ scroll: false })` para no añadir entradas al
 * historial por cada keystroke del search.
 */
export function useLeadsSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const params = useMemo<UseLeadsParams>(
    () => parseLeadsParams(new URLSearchParams(sp.toString())),
    [sp],
  );

  /** True si hay al menos un filtro NO trivial (excluye `limit`/`offset`/`sort`/`direction`). */
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      params.statuses?.length ||
        params.sources?.length ||
        params.owner_id?.length ||
        params.pipeline_id?.length ||
        params.stage_id?.length ||
        params.tag?.length ||
        params.q ||
        params.created_from ||
        params.created_to,
    );
  }, [params]);

  const writeToUrl = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const updateFilters = useCallback(
    (patch: LeadsFiltersInput) => {
      const next = new URLSearchParams(sp.toString());
      // Cuando muta cualquier filtro distinto de paginación, reseteamos `offset`
      // (UX: estás en página 5, cambias filtro → vuelve a página 1).
      const resetsOffset = Object.keys(patch).some(
        (k) => k !== "limit" && k !== "offset",
      );
      if (resetsOffset && !("offset" in patch)) {
        next.delete("offset");
      }
      // Listas: borrar y re-añadir
      for (const key of LIST_KEYS) {
        if (key in patch) {
          next.delete(key);
          const values = patch[key as ListKey];
          if (values && values.length > 0) {
            for (const v of values) next.append(key, v);
          }
        }
      }
      // Singles
      for (const key of SINGLE_KEYS) {
        if (key in patch) {
          next.delete(key);
          const value = patch[key as SingleKey];
          if (value !== undefined && value !== "" && value !== null) {
            next.set(key, String(value));
          }
        }
      }
      writeToUrl(next);
    },
    [sp, writeToUrl],
  );

  const clearFilters = useCallback(() => {
    const next = new URLSearchParams();
    // Preserva `limit` si lo tenía configurado el user (no su offset).
    const limit = sp.get("limit");
    if (limit) next.set("limit", limit);
    writeToUrl(next);
  }, [sp, writeToUrl]);

  return {
    params,
    hasActiveFilters,
    updateFilters,
    clearFilters,
  };
}
