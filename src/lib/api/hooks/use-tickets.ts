"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Ticket,
  TicketPage,
  TicketMessage,
  TicketCreate,
  TicketUpdate,
  TicketMessageCreate,
  TicketStatus,
  TicketChannel,
  TicketPriority,
} from "../types-sprint4";
import {
  TicketPageSchema,
  TicketSchema,
  TicketMessageSchema,
} from "../zod-schemas-sprint4";
import { z } from "zod";
import { apiGet, apiPost, apiPatch, type ApiRequestOptions } from "../client";
import { useClerkApiContext } from "./clerk-context";
import { toast } from "@/lib/ui/toast";

/**
 * Hooks tipados para el recurso Ticket (Sprint 4).
 *
 * Endpoints (anticipados):
 *  - GET /v1/tickets (lista paginada + filtros)
 *  - GET /v1/tickets/{id} (detalle)
 *  - POST /v1/tickets (crear)
 *  - PATCH /v1/tickets/{id} (actualizar)
 *  - GET /v1/tickets/{id}/messages (mensajes del ticket)
 *  - POST /v1/tickets/{id}/messages (enviar mensaje)
 *  - POST /v1/tickets/{id}/close (cerrar ticket)
 */

export interface UseTicketsParams {
  status?: TicketStatus[];
  channel?: TicketChannel[];
  priority?: TicketPriority[];
  assigned_to?: string;
  sla_breached?: boolean;
  q?: string;
  limit?: number;
  offset?: number;
}

export const ticketsQueryKeys = {
  all: ["/v1/tickets"] as const,
  list: (params: UseTicketsParams = {}) => ["/v1/tickets", params] as const,
  detail: (id: string) => ["/v1/tickets", id] as const,
  messages: (ticketId: string) =>
    ["/v1/tickets", ticketId, "messages"] as const,
};

/** Lista paginada de tickets del tenant. */
export function useTickets(params: UseTicketsParams = {}) {
  const { getToken, tenantId } = useClerkApiContext();

  return useQuery<TicketPage, Error>({
    queryKey: ["/v1/tickets", tenantId, params],
    queryFn: async ({ signal }) => {
      const query: Record<string, string | number | boolean | undefined> = {};
      if (params.limit) query.limit = params.limit;
      if (params.offset) query.offset = params.offset;
      if (params.assigned_to) query.assigned_to = params.assigned_to;
      if (params.sla_breached !== undefined)
        query.sla_breached = params.sla_breached;
      if (params.q) query.q = params.q;
      if (params.status?.length) query.status = params.status.join(",");
      if (params.channel?.length) query.channel = params.channel.join(",");
      if (params.priority?.length) query.priority = params.priority.join(",");

      const opts: ApiRequestOptions = { getToken, tenantId, signal, query };
      const data = await apiGet<unknown>("/v1/tickets", opts);
      return TicketPageSchema.parse(data);
    },
    placeholderData: (prev) => prev,
  });
}

/** Detalle de un ticket. */
export function useTicket(id: string | undefined) {
  const { getToken, tenantId } = useClerkApiContext();

  return useQuery<Ticket, Error>({
    queryKey: ["/v1/tickets", tenantId, id],
    queryFn: async ({ signal }) => {
      const opts: ApiRequestOptions = { getToken, tenantId, signal };
      const data = await apiGet<unknown>(`/v1/tickets/${id}`, opts);
      return TicketSchema.parse(data);
    },
    enabled: Boolean(id),
  });
}

/** Crear ticket. */
export function useCreateTicket() {
  const { getToken, tenantId } = useClerkApiContext();
  const queryClient = useQueryClient();

  return useMutation<Ticket, Error, TicketCreate>({
    mutationFn: async (body) => {
      const opts: ApiRequestOptions = {
        getToken,
        tenantId,
        idempotencyKey: "auto",
      };
      const data = await apiPost<unknown>("/v1/tickets", body, opts);
      return TicketSchema.parse(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketsQueryKeys.all });
      toast.success("Ticket creado correctamente");
    },
    onError: (error) => {
      toast.error(`Error al crear ticket: ${error.message}`);
    },
  });
}

/** Actualizar ticket. */
export function useUpdateTicket(ticketId: string) {
  const { getToken, tenantId } = useClerkApiContext();
  const queryClient = useQueryClient();

  return useMutation<Ticket, Error, TicketUpdate>({
    mutationFn: async (body) => {
      const opts: ApiRequestOptions = {
        getToken,
        tenantId,
        idempotencyKey: "auto",
      };
      const data = await apiPatch<unknown>(
        `/v1/tickets/${ticketId}`,
        body,
        opts,
      );
      return TicketSchema.parse(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketsQueryKeys.all });
      void queryClient.invalidateQueries({
        queryKey: ticketsQueryKeys.detail(ticketId),
      });
    },
    onError: (error) => {
      toast.error(`Error al actualizar ticket: ${error.message}`);
    },
  });
}

/** Mensajes de un ticket. */
export function useTicketMessages(ticketId: string | undefined) {
  const { getToken, tenantId } = useClerkApiContext();

  return useQuery<TicketMessage[], Error>({
    queryKey: ["/v1/tickets", tenantId, ticketId, "messages"],
    queryFn: async ({ signal }) => {
      const opts: ApiRequestOptions = { getToken, tenantId, signal };
      const data = await apiGet<unknown>(
        `/v1/tickets/${ticketId}/messages`,
        opts,
      );
      return z.array(TicketMessageSchema).parse(data);
    },
    enabled: Boolean(ticketId),
  });
}

/** Enviar mensaje en un ticket. */
export function useSendTicketMessage(ticketId: string) {
  const { getToken, tenantId } = useClerkApiContext();
  const queryClient = useQueryClient();

  return useMutation<TicketMessage, Error, TicketMessageCreate>({
    mutationFn: async (body) => {
      const opts: ApiRequestOptions = {
        getToken,
        tenantId,
        idempotencyKey: "auto",
      };
      const data = await apiPost<unknown>(
        `/v1/tickets/${ticketId}/messages`,
        body,
        opts,
      );
      return TicketMessageSchema.parse(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ticketsQueryKeys.messages(ticketId),
      });
      void queryClient.invalidateQueries({
        queryKey: ticketsQueryKeys.detail(ticketId),
      });
    },
    onError: (error) => {
      toast.error(`Error al enviar mensaje: ${error.message}`);
    },
  });
}

/** Cerrar ticket. */
export function useCloseTicket(ticketId: string) {
  const { getToken, tenantId } = useClerkApiContext();
  const queryClient = useQueryClient();

  return useMutation<Ticket, Error, void>({
    mutationFn: async () => {
      const opts: ApiRequestOptions = {
        getToken,
        tenantId,
        idempotencyKey: "auto",
      };
      const data = await apiPost<unknown>(
        `/v1/tickets/${ticketId}/close`,
        {},
        opts,
      );
      return TicketSchema.parse(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketsQueryKeys.all });
      void queryClient.invalidateQueries({
        queryKey: ticketsQueryKeys.detail(ticketId),
      });
      toast.success("Ticket cerrado correctamente");
    },
    onError: (error) => {
      toast.error(`Error al cerrar ticket: ${error.message}`);
    },
  });
}

// Re-exports
export type {
  Ticket,
  TicketPage,
  TicketMessage,
  TicketCreate,
  TicketUpdate,
  TicketMessageCreate,
  TicketStatus,
  TicketChannel,
  TicketPriority,
};
