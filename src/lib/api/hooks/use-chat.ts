"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ChatSession,
  ChatSendRequest,
  ChatMessage,
  ToolCall,
} from "../types-sprint5";
import {
  ChatSessionSchema,
  ChatMessageSchema,
  ToolCallSchema,
} from "../zod-schemas-sprint5";
import { apiGet, apiPost, type ApiRequestOptions } from "../client";
import { useClerkApiContext } from "./clerk-context";
import { toast } from "@/lib/ui/toast";

/**
 * Hooks tipados para AI Chat (Sprint 5).
 *
 * Endpoints (anticipados):
 *  - GET /v1/ai/chat (current session)
 *  - POST /v1/ai/chat (send message)
 *  - POST /v1/ai/tool-calls/{id}/approve
 *  - POST /v1/ai/tool-calls/{id}/reject
 */

export const chatQueryKeys = {
  session: ["/v1/ai/chat"] as const,
};

/** Current chat session. */
export function useChatSession() {
  const { getToken, tenantId } = useClerkApiContext();

  return useQuery<ChatSession, Error>({
    queryKey: ["/v1/ai/chat", tenantId],
    queryFn: async ({ signal }) => {
      const opts: ApiRequestOptions = { getToken, tenantId, signal };
      const data = await apiGet<unknown>("/v1/ai/chat", opts);
      return ChatSessionSchema.parse(data);
    },
  });
}

/** Send a message in the current chat session. */
export function useSendMessage() {
  const { getToken, tenantId } = useClerkApiContext();
  const queryClient = useQueryClient();

  return useMutation<ChatMessage, Error, ChatSendRequest>({
    mutationFn: async (body) => {
      const opts: ApiRequestOptions = {
        getToken,
        tenantId,
        idempotencyKey: "auto",
      };
      const data = await apiPost<unknown>("/v1/ai/chat", body, opts);
      return ChatMessageSchema.parse(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chatQueryKeys.session,
      });
    },
    onError: (error) => {
      toast.error(`Error al enviar mensaje: ${error.message}`);
    },
  });
}

/** Approve a tool call (human-in-the-loop). */
export function useApproveToolCall() {
  const { getToken, tenantId } = useClerkApiContext();
  const queryClient = useQueryClient();

  return useMutation<ToolCall, Error, string>({
    mutationFn: async (toolCallId) => {
      const opts: ApiRequestOptions = {
        getToken,
        tenantId,
        idempotencyKey: "auto",
      };
      const data = await apiPost<unknown>(
        `/v1/ai/tool-calls/${toolCallId}/approve`,
        {},
        opts,
      );
      return ToolCallSchema.parse(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chatQueryKeys.session,
      });
      toast.success("Accion aprobada y ejecutada");
    },
    onError: (error) => {
      toast.error(`Error al aprobar accion: ${error.message}`);
    },
  });
}

/** Reject a tool call (human-in-the-loop). */
export function useRejectToolCall() {
  const { getToken, tenantId } = useClerkApiContext();
  const queryClient = useQueryClient();

  return useMutation<ToolCall, Error, string>({
    mutationFn: async (toolCallId) => {
      const opts: ApiRequestOptions = {
        getToken,
        tenantId,
        idempotencyKey: "auto",
      };
      const data = await apiPost<unknown>(
        `/v1/ai/tool-calls/${toolCallId}/reject`,
        {},
        opts,
      );
      return ToolCallSchema.parse(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chatQueryKeys.session,
      });
      toast.info("Accion cancelada");
    },
    onError: (error) => {
      toast.error(`Error al rechazar accion: ${error.message}`);
    },
  });
}

// Re-exports
export type {
  ChatSession,
  ChatMessage,
  ChatSendRequest,
  ToolCall,
};
