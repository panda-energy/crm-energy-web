"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  AtrMessage,
  AtrMessagePage,
  AtrMessageType,
  AtrMessageStatus,
  AtrDistributor,
} from "../types-sprint4";
import {
  AtrMessagePageSchema,
  AtrMessageSchema,
} from "../zod-schemas-sprint4";
import { apiGet, apiPost, type ApiRequestOptions } from "../client";
import { useClerkApiContext } from "./clerk-context";
import { toast } from "@/lib/ui/toast";

/**
 * Hooks tipados para el recurso ATR Message (Sprint 4).
 *
 * Endpoints (anticipados — no existen aun en el backend):
 *  - GET /v1/atr/messages (lista paginada + filtros)
 *  - GET /v1/atr/messages/{id} (detalle)
 *  - POST /v1/atr/messages/{id}/retry (reintentar envio)
 *  - GET /v1/atr/messages/{id}/xml (XML del mensaje)
 */

export interface UseAtrMessagesParams {
  message_type?: AtrMessageType[];
  status?: AtrMessageStatus[];
  distributor?: AtrDistributor;
  contract_id?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export const atrQueryKeys = {
  all: ["/v1/atr/messages"] as const,
  list: (params: UseAtrMessagesParams = {}) =>
    ["/v1/atr/messages", params] as const,
  detail: (id: string) => ["/v1/atr/messages", id] as const,
  xml: (id: string) => ["/v1/atr/messages", id, "xml"] as const,
};

/** Lista paginada de mensajes ATR. */
export function useAtrMessages(params: UseAtrMessagesParams = {}) {
  const { getToken, tenantId } = useClerkApiContext();

  return useQuery<AtrMessagePage, Error>({
    queryKey: ["/v1/atr/messages", tenantId, params],
    queryFn: async ({ signal }) => {
      const query: Record<string, string | number | boolean | undefined> = {};
      if (params.limit) query.limit = params.limit;
      if (params.offset) query.offset = params.offset;
      if (params.distributor) query.distributor = params.distributor;
      if (params.contract_id) query.contract_id = params.contract_id;
      if (params.q) query.q = params.q;
      // Arrays get serialized as repeated params by the handler
      if (params.message_type?.length) {
        query.message_type = params.message_type.join(",");
      }
      if (params.status?.length) {
        query.status = params.status.join(",");
      }

      const opts: ApiRequestOptions = { getToken, tenantId, signal, query };
      const data = await apiGet<unknown>("/v1/atr/messages", opts);
      return AtrMessagePageSchema.parse(data);
    },
    placeholderData: (prev) => prev,
  });
}

/** Detalle de un mensaje ATR. */
export function useAtrMessage(id: string | undefined) {
  const { getToken, tenantId } = useClerkApiContext();

  return useQuery<AtrMessage, Error>({
    queryKey: ["/v1/atr/messages", tenantId, id],
    queryFn: async ({ signal }) => {
      const opts: ApiRequestOptions = { getToken, tenantId, signal };
      const data = await apiGet<unknown>(`/v1/atr/messages/${id}`, opts);
      return AtrMessageSchema.parse(data);
    },
    enabled: Boolean(id),
  });
}

/** Reintentar envio de un mensaje ATR (idempotente). */
export function useRetryAtrMessage() {
  const { getToken, tenantId } = useClerkApiContext();
  const queryClient = useQueryClient();

  return useMutation<AtrMessage, Error, string>({
    mutationFn: async (id) => {
      const opts: ApiRequestOptions = {
        getToken,
        tenantId,
        idempotencyKey: "auto",
      };
      const data = await apiPost<unknown>(
        `/v1/atr/messages/${id}/retry`,
        {},
        opts,
      );
      return AtrMessageSchema.parse(data);
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: atrQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: atrQueryKeys.detail(id) });
      toast.success("Reintento programado correctamente");
    },
    onError: (error) => {
      toast.error(`Error al reintentar: ${error.message}`);
    },
  });
}

/** XML raw de un mensaje ATR. */
export function useAtrMessageXml(id: string | undefined) {
  const { getToken, tenantId } = useClerkApiContext();

  return useQuery<string, Error>({
    queryKey: ["/v1/atr/messages", tenantId, id, "xml"],
    queryFn: async ({ signal }) => {
      const base =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const url = `${base}/v1/atr/messages/${id}/xml`;
      const headers: Record<string, string> = {
        Accept: "text/xml",
        "X-Correlation-Id": crypto.randomUUID(),
      };
      if (tenantId) headers["X-Tenant-Id"] = tenantId;
      if (getToken) {
        const token = await getToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch(url, { headers, signal });
      if (!response.ok) {
        throw new Error(`Failed to fetch XML: ${response.status}`);
      }
      return response.text();
    },
    enabled: Boolean(id),
  });
}

// Re-exports
export type {
  AtrMessage,
  AtrMessagePage,
  AtrMessageType,
  AtrMessageStatus,
  AtrDistributor,
};
