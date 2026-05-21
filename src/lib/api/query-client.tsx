"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { isApiError } from "./error";

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
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (isApiError(error)) {
                if (error.status < 500) return false;
                return failureCount < 2;
              }
              // Errores genéricos (network, abort): un retry máximo.
              return failureCount < 1;
            },
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
