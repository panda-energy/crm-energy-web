"use client";

import { Search } from "lucide-react";
import { useCmdkStore } from "@/lib/ui/cmdk-store";
import { KbdShortcut } from "@/components/ui/kbd-shortcut";
import { cn } from "@/lib/utils/cn";

/**
 * Botón que abre el Command Palette desde el topbar.
 *
 * En desktop muestra el shortcut a la derecha (`⌘K` / `Ctrl+K`).
 * En mobile colapsa a un botón icono — el shortcut no aplica.
 */
export interface CommandPaletteTriggerProps {
  className?: string;
}

export function CommandPaletteTrigger({ className }: CommandPaletteTriggerProps) {
  const setOpen = useCmdkStore((s) => s.setOpen);
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Buscar y ejecutar acciones (Cmd+K)"
      data-testid="cmdk-trigger"
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5",
        "text-xs text-muted-foreground transition-colors",
        "hover:border-brand/40 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "sm:w-56 sm:justify-between",
        className,
      )}
    >
      <span className="inline-flex items-center gap-2">
        <Search className="size-3.5" aria-hidden />
        <span className="hidden sm:inline">Buscar…</span>
      </span>
      <KbdShortcut keys={["mod", "k"]} className="hidden sm:inline-flex" />
    </button>
  );
}
