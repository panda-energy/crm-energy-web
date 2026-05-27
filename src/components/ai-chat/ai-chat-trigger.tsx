"use client";

import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/lib/ui/chat-store";

/**
 * Topbar trigger button for AI Chat.
 *
 * Shows a badge with pending tool calls count when > 0.
 */
export function AiChatTrigger() {
  const toggle = useChatStore((s) => s.toggle);
  const pendingCount = useChatStore((s) => s.pendingCount);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={`Asistente Panda AI${pendingCount > 0 ? ` (${pendingCount} pendiente${pendingCount > 1 ? "s" : ""})` : ""}`}
      className="relative"
    >
      <Bot className="size-4" aria-hidden />
      {pendingCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-danger-foreground">
          {pendingCount}
        </span>
      ) : null}
    </Button>
  );
}
