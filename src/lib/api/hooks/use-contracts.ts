"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import type { components } from "../types";
import {
  ContractPageSchema,
  ContractSchema,
  ContractSignResponseSchema,
  type Contract,
  type ContractCreate,
  type ContractPage,
  type ContractUpdate,
  type ContractCancel,
  type ContractSignRequest,
  type ContractSignResponse,
} from "../zod-schemas";
import { useApiQuery } from "./use-api-query";
import { useApiMutation } from "./use-api-mutation";

/**
 * Hooks tipados para el recurso Contract (Sprint 3).
 *
 * Endpoints:
 *  - GET /v1/contracts (lista paginada)
 *  - GET /v1/contracts/{contract_id} (detalle)
 *  - POST /v1/contracts (crear)
 *  - PATCH /v1/contracts/{contract_id} (actualizar)
 *  - POST /v1/contracts/{contract_id}/pdf (generar PDF)
 *  - GET /v1/contracts/{contract_id}/pdf (descargar PDF)
 *  - POST /v1/contracts/{contract_id}/sign (enviar a firma)
 *  - POST /v1/contracts/{contract_id}/cancel (cancelar)
 */

export interface UseContractsParams {
  q?: string;
  status?: components["schemas"]["ContractStatus"][];
  lead_id?: string;
  cups_id?: string;
  limit?: number;
  offset?: number;
}

export const contractsQueryKeys = {
  all: ["/v1/contracts"] as const,
  list: (params: UseContractsParams = {}) =>
    ["/v1/contracts", params] as const,
  detail: (contractId: string) => ["/v1/contracts", contractId] as const,
};

/** Lista paginada de contratos del tenant. */
export function useContracts(
  params: UseContractsParams = {},
): UseQueryResult<ContractPage, Error> {
  return useApiQuery("/v1/contracts", {
    // reason: arrays se serializan como `?status=draft&status=signed`
    query: params as unknown as Record<string, string | number | boolean | undefined>,
    schema: ContractPageSchema,
  });
}

/** Detalle de un contrato. */
export function useContract(
  contractId: string | undefined,
): UseQueryResult<Contract, Error> {
  return useApiQuery("/v1/contracts/{contract_id}", {
    pathParams: contractId ? { contract_id: contractId } : undefined,
    schema: ContractSchema,
    enabled: Boolean(contractId),
  });
}

/** Crear contrato. Idempotency-Key auto (critico). */
export function useCreateContract() {
  return useApiMutation<"/v1/contracts", "post", typeof ContractSchema>(
    "/v1/contracts",
    {
      method: "POST",
      idempotencyKey: "auto",
      schema: ContractSchema,
      invalidates: [contractsQueryKeys.all],
    },
  );
}

/** Actualizar contrato. */
export function useUpdateContract(contractId: string) {
  return useApiMutation<
    "/v1/contracts/{contract_id}",
    "patch",
    typeof ContractSchema
  >("/v1/contracts/{contract_id}", {
    method: "PATCH",
    pathParams: { contract_id: contractId },
    idempotencyKey: "auto",
    schema: ContractSchema,
    invalidates: [
      contractsQueryKeys.all,
      contractsQueryKeys.detail(contractId),
    ],
  });
}

/** Cancelar contrato. */
export function useCancelContract(contractId: string) {
  return useApiMutation<
    "/v1/contracts/{contract_id}/cancel",
    "post",
    typeof ContractSchema
  >("/v1/contracts/{contract_id}/cancel", {
    method: "POST",
    pathParams: { contract_id: contractId },
    idempotencyKey: "auto",
    schema: ContractSchema,
    invalidates: [
      contractsQueryKeys.all,
      contractsQueryKeys.detail(contractId),
    ],
  });
}

/** Generar PDF del contrato. */
export function useGeneratePdf(contractId: string) {
  return useApiMutation<
    "/v1/contracts/{contract_id}/pdf",
    "post",
    typeof ContractSchema
  >("/v1/contracts/{contract_id}/pdf", {
    method: "POST",
    pathParams: { contract_id: contractId },
    idempotencyKey: "auto",
    schema: ContractSchema,
    invalidates: [contractsQueryKeys.detail(contractId)],
  });
}

/**
 * Descargar PDF del contrato. Devuelve la URL para navegador.
 * Se usa con un `<a href>` directo o `window.open` — no un hook TanStack.
 * Exportamos como utilidad, no como hook.
 */
export function getContractPdfUrl(contractId: string): string {
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return `${base}/v1/contracts/${encodeURIComponent(contractId)}/pdf`;
}

/** Enviar a firma via Signaturit. Idempotency-Key obligatoria. */
export function useSignContract(contractId: string) {
  return useApiMutation<
    "/v1/contracts/{contract_id}/sign",
    "post",
    typeof ContractSignResponseSchema
  >("/v1/contracts/{contract_id}/sign", {
    method: "POST",
    pathParams: { contract_id: contractId },
    idempotencyKey: "auto",
    schema: ContractSignResponseSchema,
    invalidates: [
      contractsQueryKeys.all,
      contractsQueryKeys.detail(contractId),
    ],
  });
}

// Re-exports
export type {
  Contract,
  ContractCreate,
  ContractPage,
  ContractUpdate,
  ContractCancel,
  ContractSignRequest,
  ContractSignResponse,
};
