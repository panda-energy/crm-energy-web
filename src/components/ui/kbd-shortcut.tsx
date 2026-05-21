"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * KbdShortcut — render visual de un atajo de teclado.
 *
 * Detecta plataforma client-side (Mac → ⌘, otros → Ctrl). Durante SSR
 * y la primera pintura cliente devolvemos el modifier por defecto
 * (`⌘`) — la diferencia es visualmente mínima y evita hydration mismatch
 * cuando el server no conoce la plataforma del cliente.
 *
 * Composición:
 *   <KbdShortcut keys={["mod", "k"]} />
 *
 * Conviene pegarlo a la derecha del label del trigger:
 *   "Buscar... ⌘K"  → con `<KbdShortcut keys={["mod", "k"]} />`.
 *
 * Tokens: borde sutil, font mono, no usar colores marca aquí (es UI muy
 * neutra). Tamaño `text-[10px]` deliberado para no competir con el texto
 * principal del botón.
 */
export interface KbdShortcutProps {
  /**
   * Lista de teclas. Soporta el alias `"mod"` que se renderiza como `⌘`
   * en Mac y `Ctrl` en el resto. El resto se renderiza tal cual viene
   * (uppercase para letras simples).
   */
  keys: ReadonlyArray<string>;
  className?: string;
  /** Si `true`, oculta el componente al SR (la acción ya está labelada). */
  ariaHidden?: boolean;
}

const MOD_SYMBOL_DEFAULT = "⌘"; // ⌘

function useIsMac(): boolean {
  // reason: navigator.platform está deprecated pero sigue siendo el indicador
  // más fiable cross-browser para Mac. userAgentData.platform existe en
  // Chromium 90+ pero no en Firefox/Safari; lo intentamos primero y caemos
  // a navigator.platform. Solo se ejecuta client-side para evitar SSR mismatch.
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const uad = (
      navigator as Navigator & {
        userAgentData?: { platform?: string };
      }
    ).userAgentData;
    const platform = uad?.platform ?? navigator.platform ?? "";
    setIsMac(/mac/i.test(platform));
  }, []);
  return isMac;
}

/**
 * Render visual de un atajo. Para uso DENTRO del Tooltip de un botón
 * (información complementaria), no como label principal.
 */
export function KbdShortcut({
  keys,
  className,
  ariaHidden = true,
}: KbdShortcutProps) {
  const isMac = useIsMac();

  return (
    <kbd
      aria-hidden={ariaHidden}
      className={cn(
        "inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-medium font-mono text-muted-foreground",
        className,
      )}
    >
      {keys.map((key, i) => {
        const label = key === "mod" ? (isMac ? MOD_SYMBOL_DEFAULT : "Ctrl") : keyLabel(key);
        return (
          <span key={`${key}-${i}`} className="inline-flex items-center">
            {label}
          </span>
        );
      })}
    </kbd>
  );
}

function keyLabel(key: string): string {
  if (key.length === 1) return key.toUpperCase();
  // Soporte de nombres especiales reconocibles.
  const map: Record<string, string> = {
    enter: "⏎",
    shift: "⇧",
    alt: "⌥",
    option: "⌥",
    arrowup: "↑",
    arrowdown: "↓",
    arrowleft: "←",
    arrowright: "→",
    esc: "Esc",
    escape: "Esc",
  };
  return map[key.toLowerCase()] ?? key;
}
