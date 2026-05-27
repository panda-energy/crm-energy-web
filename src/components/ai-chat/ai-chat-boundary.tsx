"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useChatStore } from "@/lib/ui/chat-store";

/**
 * Boundary for AI Chat panel -- defers bundle until first open.
 *
 * Same pattern as CommandPaletteBoundary: registers a global
 * keyboard shortcut (Cmd+J / Ctrl+J) and lazy-loads the real
 * panel on first activation.
 */

const LazyAiChatPanel = dynamic(
  () =>
    import("./ai-chat-panel").then((m) => ({ default: m.AiChatPanel })),
  {
    ssr: false,
    loading: () => null,
  },
);

export function AiChatBoundary() {
  const [armed, setArmed] = useState(false);
  const open = useChatStore((s) => s.open);

  // Arm when opened via any mechanism (topbar button, shortcut, etc.)
  useEffect(() => {
    if (open && !armed) setArmed(true);
  }, [open, armed]);

  // The shortcut listener is inside AiChatPanel itself (always mounted
  // once armed). We just need to arm on first Cmd+J before the panel exists.
  useEffect(() => {
    if (armed) return undefined;
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setArmed(true);
        useChatStore.getState().toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [armed]);

  if (!armed) return null;
  return <LazyAiChatPanel />;
}
