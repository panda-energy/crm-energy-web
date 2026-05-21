"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

/**
 * Toaster — wrapper sobre `sonner`.
 *
 * Estado: solo el chasis. La API pública (`toast.success(...)`, etc.) se
 * envuelve en Wave 3 (F-1.9) dentro de `src/lib/notifications/`. Aquí solo
 * exponemos el container con tokens del design system aplicados a las
 * superficies y al borde.
 *
 * El tema (`light`/`dark`/`system`) viene de `next-themes` para que el
 * toast siga al toggle de la topbar sin parpadeos.
 */
export function Toaster(props: ToasterProps) {
  const { theme = "system" } = useTheme();

  return (
    <SonnerToaster
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface group-[.toaster]:text-surface-foreground group-[.toaster]:border-border group-[.toaster]:shadow-3",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-brand group-[.toast]:text-brand-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
