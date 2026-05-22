"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Splash sutil mostrado mientras el worker MSW arranca (0.5–2s en el
 * primer load). Sustituye al `null` previo, que dejaba la pantalla en
 * blanco — mala primera impresión para una demo.
 *
 * Diseño:
 *  - Centrado vertical/horizontal sobre `bg-background` (respeta dark mode).
 *  - Wordmark "Panda Energy" en color brand.
 *  - Subtexto explica el modo demo para evitar dudas del observador.
 *  - Spinner Lucide `Loader2` con `animate-spin`.
 *  - Transición fade-out se delega al componente padre desmontándolo (el
 *    `<MswProvider>` simplemente conmuta `children` cuando `ready`).
 *
 * Accesibilidad: `role="status"` + `aria-live="polite"` para lectores de
 * pantalla; el spinner está marcado como decorativo (`aria-hidden`).
 */
function MswBootSplash(): ReactNode {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground transition-opacity duration-300"
      data-testid="msw-boot-splash"
    >
      <p className="text-2xl font-bold text-brand">Panda Energy</p>
      <p className="text-sm text-muted-foreground">Cargando modo demo…</p>
      <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
      <span className="sr-only">Cargando aplicación, por favor espere.</span>
    </div>
  );
}

/**
 * Arranca el worker MSW en el cliente cuando NEXT_PUBLIC_API_MOCKING=enabled.
 *
 * Por qué client component:
 *  - El worker sólo existe en navegador, no en el server runtime de Next.
 *  - El import es dinámico para no incluir MSW en el bundle de producción
 *    (cuando el flag no está activado).
 *
 * Comportamiento:
 *  - Si el flag está apagado, `ready=true` desde el primer render y
 *    renderizamos `children` directamente (no hay splash ni cost).
 *  - Si el flag está encendido, esperamos a que `worker.start()` resuelva
 *    y mientras tanto renderizamos `<MswBootSplash />` (sustituye al
 *    `null` previo).
 */
export function MswProvider({ children }: { children: ReactNode }): ReactNode {
  const isMockingEnabled = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";
  const [ready, setReady] = useState(!isMockingEnabled);

  useEffect(() => {
    if (!isMockingEnabled) return;
    let cancelled = false;
    (async () => {
      const { worker } = await import("./browser");
      await worker.start({
        onUnhandledRequest: "bypass",
        serviceWorker: { url: "/mockServiceWorker.js" },
      });
      if (!cancelled) setReady(true);
    })().catch((err: unknown) => {
      // reason: log a consola, no a Sentry, porque MSW solo corre en dev.
      console.error("[MSW] no se pudo iniciar el worker", err);
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [isMockingEnabled]);

  if (!ready) return <MswBootSplash />;
  return children;
}

// Export interno para snapshot test del splash.
export { MswBootSplash };
