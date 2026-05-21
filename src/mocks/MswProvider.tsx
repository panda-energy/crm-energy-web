"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Arranca el worker MSW en el cliente cuando NEXT_PUBLIC_API_MOCKING=enabled.
 *
 * Por qué client component:
 *  - El worker sólo existe en navegador, no en el server runtime de Next.
 *  - El import es dinámico para no incluir MSW en el bundle de producción
 *    (cuando el flag no está activado).
 *
 * Por qué wraps children sin gate visual:
 *  - Bloqueamos el render hasta que el worker esté listo, evitando una race
 *    donde el primer fetch se va a la red real.
 *  - Mostramos un fallback minimalista (nada visual ruidoso).
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

  if (!ready) return null;
  return children;
}
