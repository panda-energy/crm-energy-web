"use client";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { isApiError, isNetworkError } from "./error";
import { toast } from "@/lib/ui/toast";

/**
 * Provider de TanStack Query con defaults curados para Panda.
 *
 * Defaults:
 *  - `staleTime: 30_000` — los hooks dejan de ser "stale" durante 30s, así
 *    que navegar entre rutas no re-dispara fetch idéntico cada click.
 *  - `refetchOnWindowFocus: false` — los CRMs disparan focus constantemente
 *    al alt-tabbing; el sondeo lo hacemos vía WebSocket (Sprint 4), no
 *    refetch ciego.
 *  - `retry` selectivo: NUNCA retry en 4xx (errores del cliente), hasta 2
 *    retries en 5xx (red flaky / backend reiniciando). Errores que no son
 *    `ApiError` (TypeError de red, abort) tampoco se reintentan más de una
 *    vez para no enmascarar bugs.
 *
 * El cliente vive en `useState` para que SSR + Client no compartan la misma
 * instancia entre requests (anti-patrón documentado en TanStack Query docs).
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            // Only toast for network errors and 5xx — component handles the rest
            if (isNetworkError(error)) {
              toast.error(error.message, { id: "network-error" });
            } else if (isApiError(error) && error.status >= 500) {
              toast.error("Error del servidor", {
                description: error.detail ?? error.title,
                id: `server-${error.status}`,
              });
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: "always",
            retry: (failureCount, error) => {
              if (isApiError(error)) {
                // Never retry client errors (4xx)
                if (error.status < 500) return false;
                // Retry server errors up to 2 times
                return failureCount < 2;
              }
              if (isNetworkError(error)) {
                // Don't retry if offline — wait for reconnect
                if (error.kind === "offline") return false;
                // Retry timeout/dns/unknown up to 3 times
                return failureCount < 3;
              }
              // Unknown errors: 1 retry
              return failureCount < 1;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
          },
          mutations: {
            // Las mutaciones NO reintentan automáticamente: pueden duplicar
            // efectos si el backend ya procesó (especialmente sin
            // Idempotency-Key). El caller decide vía `onError` si reintenta.
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV !== "production" && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
