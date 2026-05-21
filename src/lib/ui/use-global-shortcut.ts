"use client";

import { useEffect } from "react";

/**
 * Hook para escuchar atajos de teclado globales.
 *
 * Sintaxis:
 *   useGlobalShortcut("mod+k", openCmdK);   // ⌘K en Mac, Ctrl+K en otros
 *   useGlobalShortcut("shift+/", openHelp); // ?
 *
 * Reglas:
 *  - `mod` se traduce a `metaKey` en Mac y `ctrlKey` en Linux/Windows
 *    (detectado client-side; durante SSR el listener no se monta).
 *  - El handler se ejecuta con `preventDefault` para evitar conflictos
 *    con shortcuts nativos (`Cmd+K` en algunos browsers abre la barra
 *    de búsqueda).
 *  - Si el target del evento es un input/textarea/contenteditable, el
 *    shortcut SÓLO se dispara si incluye un modificador (mod/shift/alt).
 *    Esto evita interferir con la escritura normal.
 */
export type ShortcutCombo = string;

const PRINTABLE_TARGETS = new Set(["INPUT", "TEXTAREA"]);

interface ParsedCombo {
  key: string;
  mod: boolean;
  shift: boolean;
  alt: boolean;
}

export function parseCombo(combo: ShortcutCombo): ParsedCombo {
  const parts = combo.toLowerCase().split("+").map((p) => p.trim());
  let mod = false;
  let shift = false;
  let alt = false;
  let key = "";
  for (const p of parts) {
    if (p === "mod" || p === "cmd" || p === "ctrl") mod = true;
    else if (p === "shift") shift = true;
    else if (p === "alt" || p === "option") alt = true;
    else if (p) key = p;
  }
  return { key, mod, shift, alt };
}

export function matchEvent(
  event: KeyboardEvent,
  combo: ParsedCombo,
  isMac: boolean,
): boolean {
  if (event.key.toLowerCase() !== combo.key.toLowerCase()) return false;
  const modPressed = isMac ? event.metaKey : event.ctrlKey;
  if (combo.mod !== modPressed) return false;
  if (combo.shift !== event.shiftKey) return false;
  if (combo.alt !== event.altKey) return false;
  return true;
}

function detectIsMac(): boolean {
  if (typeof navigator === "undefined") return false;
  // reason: ver KbdShortcut — userAgentData en Chromium, navigator.platform
  // como fallback. Solo se ejecuta una vez al mount.
  const uad = (
    navigator as Navigator & { userAgentData?: { platform?: string } }
  ).userAgentData;
  const platform = uad?.platform ?? navigator.platform ?? "";
  return /mac/i.test(platform);
}

export function useGlobalShortcut(
  combo: ShortcutCombo,
  handler: () => void,
  options: { enabled?: boolean } = {},
): void {
  const enabled = options.enabled ?? true;
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;
    const parsed = parseCombo(combo);
    const isMac = detectIsMac();
    const onKeyDown = (event: KeyboardEvent) => {
      if (!matchEvent(event, parsed, isMac)) return;
      // Si el target es un input y no hay modificador, ignoramos.
      const target = event.target as HTMLElement | null;
      const isPrintableTarget =
        target?.isContentEditable ||
        (target && PRINTABLE_TARGETS.has(target.tagName));
      if (isPrintableTarget && !parsed.mod && !parsed.alt) return;
      event.preventDefault();
      handler();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [combo, handler, enabled]);
}
