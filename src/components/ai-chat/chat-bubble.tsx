"use client";

import { cn } from "@/lib/utils/cn";
import { Bot, User } from "lucide-react";
import type { ChatMessageRole } from "@/lib/api/types-sprint5";

/**
 * ChatBubble -- single message bubble in the AI chat.
 *
 * User messages align right with brand bg.
 * Assistant messages align left with muted bg.
 * System messages center with subtle styling.
 */

export interface ChatBubbleProps {
  role: ChatMessageRole;
  children: React.ReactNode;
  timestamp?: string;
  className?: string;
}

export function ChatBubble({
  role,
  children,
  timestamp,
  className,
}: ChatBubbleProps) {
  if (role === "system") {
    return (
      <div
        className={cn(
          "mx-auto max-w-[85%] rounded-lg bg-muted/50 px-3 py-2 text-center text-xs text-muted-foreground",
          className,
        )}
      >
        {children}
      </div>
    );
  }

  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-2",
        isUser ? "flex-row-reverse" : "flex-row",
        className,
      )}
    >
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-brand text-brand-foreground"
            : "bg-muted text-muted-foreground",
        )}
        aria-hidden
      >
        {isUser ? (
          <User className="size-3.5" />
        ) : (
          <Bot className="size-3.5" />
        )}
      </div>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3 py-2 text-sm",
          isUser
            ? "bg-brand text-brand-foreground"
            : "bg-muted text-foreground",
        )}
      >
        <div className="prose-chat">{children}</div>
        {timestamp ? (
          <time
            className={cn(
              "mt-1 block text-[10px]",
              isUser ? "text-brand-foreground/70" : "text-muted-foreground",
            )}
          >
            {new Date(timestamp).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        ) : null}
      </div>
    </div>
  );
}
