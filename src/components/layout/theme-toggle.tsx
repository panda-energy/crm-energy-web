"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Toggle Sol/Luna conectado a `next-themes`.
 *
 * - Soporta los tres temas `light` / `dark` / `system` pero el toggle
 *   alterna binariamente light↔dark; el modo `system` es el default
 *   inicial (definido en `<ThemeProvider defaultTheme="system">`).
 * - Evita FOUC y mismatch SSR/CSR mediante el guard `mounted`.
 * - `aria-label` cambia dinámicamente para anunciar la acción al lector.
 * - El icono se renderiza con `lucide-react`.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hasta que el cliente esté montado renderizamos un botón "vacío" del mismo
  // tamaño para no causar layout shift.
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Cambiar tema"
        aria-hidden
        // reason: no-op antes de hidratar; el guard mounted evita acción real.
        disabled
      />
    );
  }

  const isDark = resolvedTheme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={isDark ? "Tema claro" : "Tema oscuro"}
    >
      {isDark ? (
        <Sun className="size-4" aria-hidden />
      ) : (
        <Moon className="size-4" aria-hidden />
      )}
    </Button>
  );
}
