"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import {
  apiDelete,
  apiPatch,
  apiPost,
  type ApiRequestOptions,
} from "../client";
import { toast } from "@/lib/ui/toast";
import { useClerkApiContext } from "./clerk-context";
import {
  leadsQueryKeys,
  type Lead,
  type LeadPage,
  type LeadUpdate,
} from "./use-leads";

/**
 * Mutaciones de Lead con **optimistic update + rollback automático + undo 6s**
 * (F-2.7).
 *
 * Por qué no extender el useApiMutation generic:
 *  - La cache de leads tiene DOS shapes que invalidar a la vez: la lista
 *    paginada (`useLeads`) y el detalle (`useLead`). El generic acepta un
 *    `optimistic` por queryKey; aquí necesitamos coordinar varios.
 *  - El undo de delete necesita re-crear / re-insertar el lead en la cache
 *    durante 6s. El generic dispara el toast tras success — pero el undo
 *    real (revertir la operación) lo gestiona el caller.
 *
 * Solo cubrimos las acciones que el BACKLOG marca como reversibles:
 *  - delete (soft-delete + restore vía `POST /v1/leads/{id}/restore`).
 *  - update status / owner / tags (revierte la mutación via PATCH inverso).
 *
 * **Cleanup wave**: el undo de delete ya NO es limitado. Cuando el user
 * pulsa Deshacer dentro de la ventana de 6s, lanzamos restore al backend:
 * el lead vuelve a la BD (idempotente) y queda una actividad `restored`
 * en su timeline. La cache se re-puebla con el snapshot pre-delete para
 * UX inmediata; el siguiente refetch confirma desde el servidor.
 */

const UNDO_DURATION_MS = 6000;

/**
 * PATCH parcial con optimistic update sincronizado entre detalle + lista.
 * Si se pasa `undo`, además muestra un toast 6s con la acción de revertir.
 */
export function useOptimisticUpdateLead(
  leadId: string,
): UseMutationResult<
  Lead,
  Error,
  { patch: LeadUpdate; undoMessage?: string }
> {
  const { getToken, tenantId } = useClerkApiContext();
  const queryClient = useQueryClient();

  return useMutation<
    Lead,
    Error,
    { patch: LeadUpdate; undoMessage?: string },
    { previousList?: Map<string, LeadPage>; previousDetail?: Lead }
  >({
    mutationFn: async ({ patch }) => {
      const opts: ApiRequestOptions = {
        getToken,
        tenantId,
        pathParams: { lead_id: leadId },
        idempotencyKey: crypto.randomUUID(),
      };
      const response = await apiPatch<Lead>(`/v1/leads/{lead_id}`, patch, opts);
      return response;
    },

    onMutate: async ({ patch }) => {
      // Cancelamos refetches in-flight para evitar carreras.
      await queryClient.cancelQueries({ queryKey: leadsQueryKeys.detail(leadId) });
      await queryClient.cancelQueries({ queryKey: leadsQueryKeys.all });

      // Snapshot del detalle.
      const previousDetail = queryClient.getQueryData<Lead>(
        leadsQueryKeys.detail(leadId),
      );

      // Snapshot de todas las páginas de la lista (puede haber varias con
      // distintos filtros). Las recolectamos para revert.
      const previousList = new Map<string, LeadPage>();
      const pageQueries = queryClient.getQueriesData<LeadPage>({
        queryKey: leadsQueryKeys.all,
      });
      for (const [key, data] of pageQueries) {
        if (data) previousList.set(JSON.stringify(key), data);
      }

      // Aplicar optimistic al detalle.
      if (previousDetail) {
        const optimisticLead: Lead = {
          ...previousDetail,
          ...applyPatch(previousDetail, patch),
          updated_at: new Date().toISOString(),
        };
        queryClient.setQueryData(
          leadsQueryKeys.detail(leadId),
          optimisticLead,
        );
        // Aplicar también en cada página de la lista que contenga este lead.
        for (const [key] of pageQueries) {
          queryClient.setQueryData<LeadPage>(key, (old) => {
            if (!old) return old;
            return {
              ...old,
              items: old.items.map((l) =>
                l.id === leadId ? optimisticLead : l,
              ),
            };
          });
        }
      }

      return { previousDetail, previousList };
    },

    onError: (_err, _vars, context) => {
      // Rollback: restauramos snapshots.
      if (context?.previousDetail) {
        queryClient.setQueryData(
          leadsQueryKeys.detail(leadId),
          context.previousDetail,
        );
      }
      if (context?.previousList) {
        for (const [key, data] of context.previousList) {
          queryClient.setQueryData(JSON.parse(key), data);
        }
      }
      toast.error("No se pudo guardar el cambio", {
        description: _err.message,
      });
    },

    onSuccess: (data, vars, context) => {
      // Servidor confirma — actualizamos cache al payload real (no al
      // optimistic).
      queryClient.setQueryData(leadsQueryKeys.detail(leadId), data);
      queryClient.invalidateQueries({ queryKey: leadsQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: leadsQueryKeys.activities(leadId),
      });

      // Undo opcional: revierte mandando un PATCH con el valor anterior.
      if (vars.undoMessage && context?.previousDetail) {
        const previousLead = context.previousDetail;
        const inverse = buildInversePatch(previousLead, vars.patch);
        if (inverse) {
          toast.action(vars.undoMessage, {
            actionLabel: "Deshacer",
            duration: UNDO_DURATION_MS,
            onAction: async () => {
              try {
                await apiPatch<Lead>(
                  `/v1/leads/{lead_id}`,
                  inverse,
                  {
                    getToken,
                    tenantId,
                    pathParams: { lead_id: leadId },
                    idempotencyKey: crypto.randomUUID(),
                  },
                );
                queryClient.invalidateQueries({
                  queryKey: leadsQueryKeys.all,
                });
                queryClient.invalidateQueries({
                  queryKey: leadsQueryKeys.detail(leadId),
                });
                queryClient.invalidateQueries({
                  queryKey: leadsQueryKeys.activities(leadId),
                });
                toast.success("Cambio revertido");
              } catch (err) {
                toast.error("No se pudo deshacer", {
                  description:
                    err instanceof Error ? err.message : undefined,
                });
              }
            },
          });
        }
      }
    },
  });
}

/**
 * Soft-delete con optimistic remove + undo real de 6s vía
 * `POST /v1/leads/{id}/restore` (cleanup wave).
 *
 * Flujo end-to-end:
 *  1. `onMutate` saca el lead de TODAS las páginas de la lista y guarda
 *     snapshots para revert en caso de fallo de la DELETE.
 *  2. Si la DELETE falla → restauramos los snapshots y mostramos error.
 *  3. Si la DELETE tiene éxito → mostramos toast con acción "Deshacer".
 *     Al pulsar Deshacer, llamamos al endpoint `/restore` (idempotente),
 *     re-inyectamos el `previousDetail` en cada página snapshotada para
 *     UX inmediata, e invalidamos para resync con backend.
 *
 * Argumento `vars.undoEnabled` (default `true`) — solo se desactiva para
 * delete en flujos no reversibles (no usado actualmente; lo dejamos para
 * forward-compat). Si es `false`, el toast usa `success` simple sin
 * acción.
 */
export function useOptimisticDeleteLead(
  leadId: string,
): UseMutationResult<
  void,
  Error,
  { undoMessage: string; undoEnabled?: boolean }
> {
  const { getToken, tenantId } = useClerkApiContext();
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { undoMessage: string; undoEnabled?: boolean },
    { previousList: Map<string, LeadPage>; previousDetail?: Lead }
  >({
    mutationFn: async () => {
      await apiDelete<void>(`/v1/leads/{lead_id}`, {
        getToken,
        tenantId,
        pathParams: { lead_id: leadId },
        idempotencyKey: crypto.randomUUID(),
      });
    },

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: leadsQueryKeys.all });
      const previousDetail = queryClient.getQueryData<Lead>(
        leadsQueryKeys.detail(leadId),
      );
      const previousList = new Map<string, LeadPage>();
      const pageQueries = queryClient.getQueriesData<LeadPage>({
        queryKey: leadsQueryKeys.all,
      });
      for (const [key, data] of pageQueries) {
        if (data) previousList.set(JSON.stringify(key), data);
        queryClient.setQueryData<LeadPage>(key, (old) => {
          if (!old) return old;
          const filtered = old.items.filter((l) => l.id !== leadId);
          return {
            ...old,
            items: filtered,
            total: Math.max(
              0,
              old.total -
                (filtered.length === old.items.length ? 0 : 1),
            ),
          };
        });
      }
      return { previousDetail, previousList };
    },

    onError: (err, _vars, context) => {
      if (context?.previousList) {
        for (const [key, data] of context.previousList) {
          queryClient.setQueryData(JSON.parse(key), data);
        }
      }
      toast.error("No se pudo eliminar el lead", {
        description: err.message,
      });
    },

    onSuccess: (_data, vars, context) => {
      const enabled = vars.undoEnabled !== false;
      if (!enabled) {
        toast.success(vars.undoMessage);
        return;
      }

      toast.action(vars.undoMessage, {
        actionLabel: "Deshacer",
        duration: UNDO_DURATION_MS,
        onAction: async () => {
          try {
            await apiPost<void>(
              `/v1/leads/{lead_id}/restore`,
              undefined,
              {
                getToken,
                tenantId,
                pathParams: { lead_id: leadId },
                idempotencyKey: crypto.randomUUID(),
              },
            );
            // Re-inserta el lead en cada snapshot de página. Si la página
            // contenía el lead, lo volvemos a meter en su posición original
            // (best-effort: lo prepend si no recuperable).
            if (context?.previousList) {
              for (const [key, prevPage] of context.previousList) {
                queryClient.setQueryData(JSON.parse(key), prevPage);
              }
            }
            if (context?.previousDetail) {
              queryClient.setQueryData(
                leadsQueryKeys.detail(leadId),
                context.previousDetail,
              );
            }
            // Invalida para que el siguiente refetch sincronice con BD.
            void queryClient.invalidateQueries({
              queryKey: leadsQueryKeys.all,
            });
            void queryClient.invalidateQueries({
              queryKey: leadsQueryKeys.detail(leadId),
            });
            void queryClient.invalidateQueries({
              queryKey: leadsQueryKeys.activities(leadId),
            });
            toast.success("Lead restaurado");
          } catch (err) {
            toast.error("No se pudo restaurar el lead", {
              description:
                err instanceof Error ? err.message : undefined,
            });
          }
        },
      });
    },
  });
}

/**
 * Construye un objeto Lead "parcheado" según el `LeadUpdate` recibido,
 * usado para el optimistic. Solo cubre los campos que pueden venir en
 * un LeadUpdate.
 */
function applyPatch(lead: Lead, patch: LeadUpdate): Partial<Lead> {
  const out: Partial<Lead> = {};
  if ("first_name" in patch) out.first_name = patch.first_name ?? null;
  if ("last_name" in patch) out.last_name = patch.last_name ?? null;
  if ("email" in patch) out.email = patch.email ?? null;
  if ("phone" in patch) {
    // reason: el backend acepta `phone` en LeadUpdate y lo serializa como
    // `phone_e164` en LeadOut. Para el optimistic copiamos sin más.
    out.phone_e164 = patch.phone ?? null;
  }
  if ("company" in patch) out.company = patch.company ?? null;
  if ("cups" in patch) out.cups = patch.cups ?? null;
  if ("source" in patch && patch.source) out.source = patch.source;
  if ("source_ref" in patch) out.source_ref = patch.source_ref ?? null;
  if ("owner_id" in patch) out.owner_id = patch.owner_id ?? null;
  if ("tags" in patch) out.tags = patch.tags ?? [];
  if ("estimated_value_cents" in patch) {
    out.estimated_value_cents = patch.estimated_value_cents ?? null;
  }
  if ("last_contacted_at" in patch) {
    out.last_contacted_at = patch.last_contacted_at ?? null;
  }
  return out;
}

/**
 * Dada la versión previa del lead y el PATCH aplicado, calcula el PATCH
 * inverso para deshacer la mutación. Si no hay nada reversible (el caller
 * sólo mandó campos cuyo valor anterior era undefined), devuelve null.
 */
function buildInversePatch(
  previousLead: Lead,
  patch: LeadUpdate,
): LeadUpdate | null {
  const inverse: LeadUpdate = {};
  let hasContent = false;

  const fields = [
    "first_name",
    "last_name",
    "email",
    "company",
    "cups",
    "source",
    "source_ref",
    "owner_id",
    "estimated_value_cents",
    "last_contacted_at",
  ] as const;

  for (const f of fields) {
    if (f in patch) {
      // reason: en LeadOut, phone va como `phone_e164`. Lo manejamos aparte.
      (inverse as Record<string, unknown>)[f] = previousLead[f as keyof Lead];
      hasContent = true;
    }
  }
  if ("phone" in patch) {
    inverse.phone = previousLead.phone_e164;
    hasContent = true;
  }
  if ("tags" in patch) {
    inverse.tags = [...previousLead.tags];
    hasContent = true;
  }

  return hasContent ? inverse : null;
}

// Exportamos los helpers internos para que los tests puedan ejercitarlos.
export const __TESTONLY__ = { applyPatch, buildInversePatch };
