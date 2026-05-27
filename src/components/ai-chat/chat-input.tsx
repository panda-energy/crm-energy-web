"use client";

import { useRef, useState, useCallback } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/**
 * ChatInput -- text input at the bottom of the AI chat panel.
 *
 * Features:
 *  - Contextual placeholder based on current page route
 *  - Submit via Enter (Shift+Enter for newline)
 *  - Disabled while sending
 */

export interface ChatInputProps {
  onSend: (content: string) => void;
  isSending: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  onSend,
  isSending,
  placeholder = "Escribe un mensaje...",
  className,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setValue("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, isSending, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      // Auto-resize
      const el = e.target;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    },
    [],
  );

  return (
    <div
      className={cn(
        "flex items-end gap-2 border-t border-border bg-surface p-3",
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isSending}
        rows={1}
        aria-label="Mensaje para Panda AI"
        className={cn(
          "flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      />
      <Button
        size="icon"
        onClick={handleSubmit}
        disabled={!value.trim() || isSending}
        aria-label="Enviar mensaje"
        className="shrink-0"
      >
        <SendHorizontal className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
