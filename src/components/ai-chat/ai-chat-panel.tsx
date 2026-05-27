"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { useChatStore } from "@/lib/ui/chat-store";
import { useChatSession, useSendMessage } from "@/lib/api/hooks/use-chat";
import { ChatBubble } from "./chat-bubble";
import { ChatInput } from "./chat-input";
import { StreamingMessage } from "./streaming-message";
import { ThinkingIndicator } from "./thinking-indicator";
import { MarkdownContent } from "./markdown-content";

/**
 * AiChatPanel -- global side drawer for conversational AI.
 *
 * Lives in the authenticated layout (like cmd-k).
 * Persists between navigations. Activated via button or Ctrl+J / Cmd+J.
 *
 * Messages are fetched via TanStack Query (useChatSession).
 * Sending via useSendMessage with idempotency key.
 *
 * Assistant messages render markdown via react-markdown + remark-gfm.
 * The latest assistant message (after a user send) uses StreamingMessage
 * for a typing effect.
 */

function getContextualPlaceholder(pathname: string): string {
  if (pathname.startsWith("/leads")) return "Pregunta sobre leads...";
  if (pathname.startsWith("/pipeline")) return "Pregunta sobre el pipeline...";
  if (pathname.startsWith("/cups")) return "Pregunta sobre CUPS...";
  if (pathname.startsWith("/contracts")) return "Pregunta sobre contratos...";
  if (pathname.startsWith("/atr")) return "Pregunta sobre ATR...";
  if (pathname.startsWith("/tickets")) return "Pregunta sobre tickets...";
  if (pathname.startsWith("/commissions"))
    return "Pregunta sobre comisiones...";
  return "Pregunta lo que necesites...";
}

function extractEntityFromPath(pathname: string): {
  entity_type?: string;
  entity_id?: string;
} {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 2) {
    const mapping: Record<string, string> = {
      leads: "lead",
      cups: "cups",
      contracts: "contract",
      atr: "atr_message",
      tickets: "ticket",
    };
    const entityType = mapping[segments[0] ?? ""];
    if (entityType && segments[1]) {
      return { entity_type: entityType, entity_id: segments[1] };
    }
  }
  return {};
}

export function AiChatPanel() {
  const open = useChatStore((s) => s.open);
  const setOpen = useChatStore((s) => s.setOpen);
  const setPendingCount = useChatStore((s) => s.setPendingCount);
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Track the ID of the last message that should be animated (streaming)
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);

  const { data: session, isLoading } = useChatSession();
  const sendMessage = useSendMessage();

  // Update pending tool calls count
  useEffect(() => {
    if (!session?.messages) {
      setPendingCount(0);
      return;
    }
    let count = 0;
    for (const msg of session.messages) {
      if (!msg.tool_calls) continue;
      for (const tc of msg.tool_calls) {
        if (tc.status === "pending_approval") count++;
      }
    }
    setPendingCount(count);
  }, [session?.messages, setPendingCount]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [session?.messages?.length, open]);

  // Keyboard shortcut: Cmd+J / Ctrl+J
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "j") {
        e.preventDefault();
        useChatStore.getState().toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSend = useCallback(
    (content: string) => {
      const entity = extractEntityFromPath(pathname);
      sendMessage.mutate(
        {
          content,
          context: {
            page: pathname,
            ...entity,
          },
        },
        {
          onSuccess: (assistantMsg) => {
            // Mark the new assistant message for streaming animation
            setStreamingMsgId(assistantMsg.id);
          },
        },
      );
    },
    [pathname, sendMessage],
  );

  const handleNewConversation = useCallback(() => {
    // In production this would POST /v1/ai/chat/new
    // For MSW demo, no-op
  }, []);

  const renderMessageContent = useCallback(
    (msg: { id: string; role: string; content: string }) => {
      if (msg.role === "assistant") {
        const shouldAnimate = msg.id === streamingMsgId;
        if (shouldAnimate) {
          return (
            <StreamingMessage
              content={msg.content}
              animate
              onComplete={() => setStreamingMsgId(null)}
            />
          );
        }
        return <MarkdownContent content={msg.content} />;
      }
      return msg.content;
    },
    [streamingMsgId],
  );

  return (
    <>
      {/* Overlay */}
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      {/* Panel */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-border bg-surface shadow-2xl transition-transform duration-300 ease-out md:w-[420px]",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="complementary"
        aria-label="Asistente Panda AI"
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot className="size-5 text-brand" aria-hidden />
            <h2 className="text-sm font-semibold">Panda AI</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewConversation}
              aria-label="Nueva conversacion"
              className="size-8"
            >
              <Plus className="size-4" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="Cerrar asistente AI"
              className="size-8"
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {isLoading ? (
            <div
              className="flex flex-col gap-3"
              role="status"
              aria-label="Cargando conversacion"
            >
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="ml-auto h-8 w-1/2" />
              <Skeleton className="h-16 w-3/4" />
              <Skeleton className="ml-auto h-8 w-2/3" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {session?.messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  role={msg.role}
                  timestamp={msg.created_at}
                >
                  {renderMessageContent(msg)}
                </ChatBubble>
              ))}
              {sendMessage.isPending ? <ThinkingIndicator /> : null}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          isSending={sendMessage.isPending}
          placeholder={getContextualPlaceholder(pathname)}
        />
      </aside>
    </>
  );
}
