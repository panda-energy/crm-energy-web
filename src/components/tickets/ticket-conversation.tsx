"use client";

import { useRef, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import type { Ticket } from "@/lib/api/types-sprint4";
import {
  useTicketMessages,
  useSendTicketMessage,
} from "@/lib/api/hooks/use-tickets";
import { TicketConversationHeader } from "./ticket-conversation-header";
import { ChatMessage, ChatDateSeparator } from "./chat-message";

interface TicketConversationProps {
  ticket: Ticket;
}

export function TicketConversation({ ticket }: TicketConversationProps) {
  const { data: messages, isLoading } = useTicketMessages(ticket.id);
  const sendMutation = useSendTicketMessage(ticket.id);
  const [replyText, setReplyText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const text = replyText.trim();
    if (!text) return;
    sendMutation.mutate(
      { body: text },
      {
        onSuccess: () => setReplyText(""),
      },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isClosed = ticket.status === "closed";

  // Group messages by date for separators
  const groupedMessages = messages
    ? groupByDate(messages.map((m) => ({ ...m, date: m.created_at.split("T")[0]! })))
    : [];

  return (
    <div className="flex h-full flex-col">
      {/* Header bar */}
      <TicketConversationHeader ticket={ticket} />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading && <MessagesSkeleton />}
        {groupedMessages.map((group) => (
          <div key={group.date}>
            <ChatDateSeparator date={group.date} />
            {group.messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      {!isClosed && (
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva linea)"
              rows={2}
              className="min-h-[60px] resize-none"
              aria-label="Respuesta del ticket"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!replyText.trim() || sendMutation.isPending}
              aria-label="Enviar mensaje"
            >
              <Send className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}
      {isClosed && (
        <div className="border-t border-border px-4 py-3 text-center text-sm text-muted-foreground">
          Este ticket esta cerrado. No se pueden enviar mas mensajes.
        </div>
      )}
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
          <Skeleton className="h-16 w-64 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

interface MessageWithDate {
  date: string;
  [key: string]: unknown;
}

function groupByDate<T extends MessageWithDate>(
  messages: T[],
): { date: string; messages: T[] }[] {
  const groups: { date: string; messages: T[] }[] = [];
  let currentDate = "";
  for (const msg of messages) {
    if (msg.date !== currentDate) {
      currentDate = msg.date;
      groups.push({ date: currentDate, messages: [] });
    }
    groups[groups.length - 1]!.messages.push(msg);
  }
  return groups;
}
