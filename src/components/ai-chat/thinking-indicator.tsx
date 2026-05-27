"use client";

import { Bot } from "lucide-react";

/**
 * ThinkingIndicator -- 3-dot animation while AI generates response.
 */
export function ThinkingIndicator() {
  return (
    <div className="flex gap-2" role="status" aria-label="Generando respuesta">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Bot className="size-3.5" aria-hidden />
      </div>
      <div className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2">
        <span className="text-xs text-muted-foreground">Pensando</span>
        <span className="flex gap-0.5">
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
        </span>
      </div>
    </div>
  );
}
