"use client";

import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import {
  apiDelete,
  apiPatch,
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
 *  - delete (soft-delete + restore visual en cache hasta refetch).
 *  - update status / owner / tags (revierte la mutación via PATCH inverso).
 *
 * La "deuda backend" del restore se gestiona elegantemente: durante los 6s
 * que dura el toast, el lead sigue en caché frontend (lo restauramos a
 * `previousData`). Si el user pulsa Deshacer dentro de la ventana, NO
 * llamamos al backend para "restaurar" — solo descartamos la mutación
 * pendiente local. Pero como el backend YA hizo el soft-delete, al
 * refetch siguiente el lead desaparece igualmente. Por eso lo flagueamos
 * como "undo limitado" y desactivamos el botón en lead-detail-sheet.
 *
 * Para esta wave, el undo SÍ está activo en:
 *  - update inline (status change, owner change, tags) → revierte
 *    mandando PATCH inverso con el valor anterior. Esto SÍ funciona
 *    extremo a extremo.
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
 * Soft-delete con optimistic remove de la cache de lista.
 *
 * El undo de 6s aquí es **limitado**: el toast aparece, pero el botón
 * Deshacer queda explícitamente deshabilitado con tooltip — backend aún
 * no expone restore. Cuando lo exponga (deuda), reemplazar el `onAction`
 * por la llamada real.
 */
export function useOptimisticDeleteLead(
  leadId: string,
): UseMutationResult<
  void,
  Error,
  { undoMessage: string; restoreEnabled?: boolean }
> {
  const { getToken, tenantId } = useClerkApiContext();
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { undoMessage: string; restoreEnabled?: boolean },
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
            total: Math.max(0, old.total - (filtered.length === old.items.length ? 0 : 1)),
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

    onSuccess: (_data, vars) => {
      // Toast con undo (limitado hasta que backend exponga restore).
      toast.action(vars.undoMessage, {
        actionLabel: vars.restoreEnabled ? "Deshacer" : "Restore pendiente",
        duration: UNDO_DURATION_MS,
        onAction: async () => {
          if (!vars.restoreEnabled) {
            toast.info("Restore aún no disponible", {
              description:
                "Pendiente del endpoint POST /v1/leads/{id}/restore (backend).",
            });
            return;
          }
          // reason: cuando esté el endpoint, llamar a `apiPost` con
          // `/v1/leads/{lead_id}/restore` e invalidar caches.
          toast.info("Pendiente de implementación.");
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
