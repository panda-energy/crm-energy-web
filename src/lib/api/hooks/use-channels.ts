"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  Channel,
  Commission,
  CommissionPage,
  CommissionSummary,
  CommissionStatus,
} from "../types-sprint5";
import {
  ChannelSchema,
  CommissionPageSchema,
  CommissionSummarySchema,
} from "../zod-schemas-sprint5";
import { z } from "zod";
import { apiGet, type ApiRequestOptions } from "../client";
import { useClerkApiContext } from "./clerk-context";

/**
 * Hooks tipados para Canales y Comisiones (Sprint 5).
 *
 * Endpoints (anticipados):
 *  - GET /v1/channels
 *  - GET /v1/channels/{id}
 *  - GET /v1/commissions (lista paginada)
 *  - GET /v1/commissions/summary
 */

export interface UseCommissionsParams {
  channel_id?: string;
  status?: CommissionStatus[];
  period?: string;
  agent_user_id?: string;
  limit?: number;
  offset?: number;
}

export const channelsQueryKeys = {
  all: ["/v1/channels"] as const,
  detail: (id: string) => ["/v1/channels", id] as const,
};

export const commissionsQueryKeys = {
  all: ["/v1/commissions"] as const,
  list: (params: UseCommissionsParams = {}) =>
    ["/v1/commissions", params] as const,
  summary: ["/v1/commissions/summary"] as const,
};

/** Lista de canales del tenant. */
export function useChannels() {
  const { getToken, tenantId } = useClerkApiContext();

  return useQuery<Channel[], Error>({
    queryKey: ["/v1/channels", tenantId],
    queryFn: async ({ signal }) => {
      const opts: ApiRequestOptions = { getToken, tenantId, signal };
      const data = await apiGet<unknown>("/v1/channels", opts);
      return z.array(ChannelSchema).parse(data);
    },
  });
}

/** Detalle de un canal. */
export function useChannel(channelId: string | undefined) {
  const { getToken, tenantId } = useClerkApiContext();

  return useQuery<Channel, Error>({
    queryKey: ["/v1/channels", tenantId, channelId],
    queryFn: async ({ signal }) => {
      const opts: ApiRequestOptions = { getToken, tenantId, signal };
      const data = await apiGet<unknown>(
        `/v1/channels/${channelId}`,
        opts,
      );
      return ChannelSchema.parse(data);
    },
    enabled: Boolean(channelId),
  });
}

/** Lista paginada de comisiones. */
export function useCommissions(params: UseCommissionsParams = {}) {
  const { getToken, tenantId } = useClerkApiContext();

  return useQuery<CommissionPage, Error>({
    queryKey: ["/v1/commissions", tenantId, params],
    queryFn: async ({ signal }) => {
      const query: Record<string, string | number | boolean | undefined> = {};
      if (params.limit) query.limit = params.limit;
      if (params.offset) query.offset = params.offset;
      if (params.channel_id) query.channel_id = params.channel_id;
      if (params.period) query.period = params.period;
      if (params.agent_user_id) query.agent_user_id = params.agent_user_id;
      if (params.status?.length) query.status = params.status.join(",");

      const opts: ApiRequestOptions = { getToken, tenantId, signal, query };
      const data = await apiGet<unknown>("/v1/commissions", opts);
      return CommissionPageSchema.parse(data);
    },
    placeholderData: (prev) => prev,
  });
}

/** Resumen de comisiones del comercial logueado. */
export function useCommissionSummary() {
  const { getToken, tenantId } = useClerkApiContext();

  return useQuery<CommissionSummary, Error>({
    queryKey: ["/v1/commissions/summary", tenantId],
    queryFn: async ({ signal }) => {
      const opts: ApiRequestOptions = { getToken, tenantId, signal };
      const data = await apiGet<unknown>("/v1/commissions/summary", opts);
      return CommissionSummarySchema.parse(data);
    },
  });
}

// Re-exports
export type {
  Channel,
  Commission,
  CommissionPage,
  CommissionSummary,
  CommissionStatus,
};
