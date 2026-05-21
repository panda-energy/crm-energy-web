"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import {
  PipelineListSchema,
  PipelineSchema,
  PipelineStageListSchema,
  type Pipeline,
  type PipelineCreate,
  type PipelineList,
  type PipelineStage,
  type PipelineStageList,
  type PipelineStageReplace,
  type PipelineUpdate,
} from "../zod-schemas";
import { useApiMutation } from "./use-api-mutation";
import { useApiQuery } from "./use-api-query";

/**
 * Hooks tipados específicos del recurso Pipeline.
 *
 * El backend siembra automáticamente una pipeline "Default" con 5 stages
 * (`New` → `Contacted` → `Qualified` → `Won` / `Lost`) al provisionar un
 * tenant. Los hooks de lista no requieren parámetros — devuelven todas las
 * pipelines del tenant activo.
 */

export const pipelinesQueryKeys = {
  all: ["/v1/pipelines"] as const,
  list: () => ["/v1/pipelines"] as const,
  detail: (pipelineId: string) => ["/v1/pipelines", pipelineId] as const,
  stages: (pipelineId: string) =>
    ["/v1/pipelines", pipelineId, "stages"] as const,
};

/** Lista de pipelines del tenant. Con boundary validation Zod. */
export function usePipelines(): UseQueryResult<PipelineList, Error> {
  return useApiQuery("/v1/pipelines", {
    schema: PipelineListSchema,
  });
}

/** Detalle de una pipeline con sus stages embebidos. */
export function usePipeline(
  pipelineId: string | undefined,
): UseQueryResult<Pipeline, Error> {
  return useApiQuery("/v1/pipelines/{pipeline_id}", {
    pathParams: pipelineId ? { pipeline_id: pipelineId } : undefined,
    schema: PipelineSchema,
    enabled: Boolean(pipelineId),
  });
}

/**
 * Lista solo los stages de una pipeline. Útil cuando el componente sabe la
 * pipeline y solo necesita los stages (drag-and-drop entre columnas Kanban).
 */
export function usePipelineStages(
  pipelineId: string | undefined,
): UseQueryResult<PipelineStageList, Error> {
  return useApiQuery("/v1/pipelines/{pipeline_id}/stages", {
    pathParams: pipelineId ? { pipeline_id: pipelineId } : undefined,
    schema: PipelineStageListSchema,
    enabled: Boolean(pipelineId),
  });
}

/**
 * Crea una pipeline nueva. Si `stages` viene vacío el backend NO siembra
 * defaults (sólo el bootstrap del tenant lo hace). Si `is_default: true`,
 * la anterior default queda demoted.
 */
export function useCreatePipeline() {
  return useApiMutation<"/v1/pipelines", "post", typeof PipelineSchema>(
    "/v1/pipelines",
    {
      method: "POST",
      idempotencyKey: "auto",
      schema: PipelineSchema,
      invalidates: [pipelinesQueryKeys.all],
    },
  );
}

/** PATCH de nombre / `is_default` de una pipeline. */
export function useUpdatePipeline(pipelineId: string) {
  return useApiMutation<
    "/v1/pipelines/{pipeline_id}",
    "patch",
    typeof PipelineSchema
  >("/v1/pipelines/{pipeline_id}", {
    method: "PATCH",
    pathParams: { pipeline_id: pipelineId },
    idempotencyKey: "auto",
    schema: PipelineSchema,
    invalidates: [
      pipelinesQueryKeys.all,
      pipelinesQueryKeys.detail(pipelineId),
    ],
  });
}

/**
 * Reemplaza todas las stages de una pipeline (PUT). El backend normaliza
 * `position` a múltiplos de 10 en el orden recibido. Falla si quedan leads
 * en stages que se eliminan — migrar primero.
 */
export function useReplacePipelineStages(pipelineId: string) {
  return useApiMutation<
    "/v1/pipelines/{pipeline_id}/stages",
    "put",
    typeof PipelineStageListSchema
  >("/v1/pipelines/{pipeline_id}/stages", {
    method: "PUT",
    pathParams: { pipeline_id: pipelineId },
    idempotencyKey: "auto",
    schema: PipelineStageListSchema,
    invalidates: [
      pipelinesQueryKeys.all,
      pipelinesQueryKeys.detail(pipelineId),
      pipelinesQueryKeys.stages(pipelineId),
    ],
  });
}

// Re-exportamos los tipos para que los callers no tengan que cruzar imports.
export type {
  Pipeline,
  PipelineCreate,
  PipelineList,
  PipelineStage,
  PipelineStageList,
  PipelineStageReplace,
  PipelineUpdate,
};
