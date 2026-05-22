"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Arranca el worker MSW en el cliente cuando NEXT_PUBLIC_API_MOCKING=enabled.
 *
 * Diseño no-bloqueante: el provider renderiza `children` inmediatamente y
 * arranca el worker en background. Las primeras requests pueden fallar
 * milisegundos hasta que el worker esté listo (TanStack Query las reintenta),
 * pero el shell de la app es visible al instante.
 *
 * El diseño previo bloqueaba el render con un splash; si MSW fallaba al
 * arrancar (chunk lento, SW zombi en caché, error en handlers), la pantalla
 * se quedaba congelada en el splash sin manera de seguir adelante. Esto
 * causó el bug "no carga nada en /leads" reportado el 2026-05-22.
 *
 * Por qué client component:
 *  - El worker sólo existe en navegador, no en el server runtime de Next.
 *  - El import es dinámico para no incluir MSW en el bundle de producción
 *    (cuando el flag no está activado).
 */
export function MswProvider({ children }: { children: ReactNode }): ReactNode {
  const isMockingEnabled = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";
  const [status, setStatus] = useState<"idle" | "starting" | "ready" | "error">(
    isMockingEnabled ? "starting" : "idle",
  );

  useEffect(() => {
    if (!isMockingEnabled) return;
    let cancelled = false;
    (async () => {
      const { worker } = await import("./browser");
      await worker.start({
        onUnhandledRequest: "bypass",
        serviceWorker: { url: "/mockServiceWorker.js" },
        quiet: true,
      });
      if (!cancelled) setStatus("ready");
    })().catch((err: unknown) => {
      // reason: log a consola, no a Sentry, porque MSW solo corre en dev.
      console.error("[MSW] no se pudo iniciar el worker", err);
      if (!cancelled) setStatus("error");
    });
    return () => {
      cancelled = true;
    };
  }, [isMockingEnabled]);

  return (
    <>
      {children}
      {isMockingEnabled && (status === "starting" || status === "error") ? (
        <MswStatusBadge status={status} />
      ) : null}
    </>
  );
}

/**
 * Badge no-bloqueante en la esquina superior derecha que indica el estado
 * del worker MSW. Visible solo mientras MSW arranca o si falló — desaparece
 * cuando `ready`.
 */
function MswStatusBadge({ status }: { status: "starting" | "error" }): ReactNode {
  const isError = status === "error";
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed right-4 top-4 z-50 rounded-full border px-3 py-1 text-xs font-medium shadow-sm ${
        isError
          ? "border-danger/30 bg-danger/10 text-danger"
          : "border-border bg-surface text-muted-foreground"
      }`}
      data-testid="msw-status-badge"
    >
      {isError ? "MSW no arrancó · revisa consola" : "Cargando datos demo…"}
    </div>
  );
}

// Export interno para snapshot test del provider.
export { MswStatusBadge };
