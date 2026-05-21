"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import type { GetTokenFn } from "../client";

/**
 * Bridge entre Clerk y el cliente API.
 *
 * Expone:
 *  - `getToken`: callback que `apiGet`/`apiPost` consumen para inyectar
 *    Bearer en cada request. Si no hay sesión, devuelve `null` y el cliente
 *    omite el header.
 *  - `tenantId`: el `orgId` activo del usuario, que se inyecta como
 *    `X-Tenant-Id` (redundante con el JWT claim — defensa en profundidad).
 *
 * Implementación:
 *  - `<ClerkApiBridge>` se monta DENTRO de `<ClerkProvider>` cuando Clerk
 *    está configurado. Llama `useAuth()` (que requiere provider) y publica
 *    el resultado en un Context propio.
 *  - Cuando Clerk no está configurado (modo demo), el Context tiene su
 *    default `{ getToken: noop, tenantId: null }` y la app sigue funcionando
 *    contra MSW sin auth.
 *
 * Reglas de hooks: este patrón evita `try/catch` alrededor de `useAuth`,
 * que rompería el orden de hooks entre renders en modo demo.
 */

interface ClerkApiContext {
  getToken: GetTokenFn;
  tenantId: string | null;
}

const noopGetToken: GetTokenFn = async () => null;

const DEFAULT_CONTEXT: ClerkApiContext = {
  getToken: noopGetToken,
  tenantId: null,
};

const Ctx = createContext<ClerkApiContext>(DEFAULT_CONTEXT);

/**
 * Hook público: usar en cualquier client component que necesite hablar con
 * la API. Si no hay `<ClerkApiBridge>` arriba en el árbol (modo demo), cae
 * al contexto neutro y la request sale sin Authorization.
 */
export function useClerkApiContext(): ClerkApiContext {
  return useContext(Ctx);
}

/**
 * Provider que SOLO se monta dentro de `<ClerkProvider>` — ver
 * `app/providers.tsx`. Llama `useAuth()` y publica `getToken` + `tenantId`.
 */
export function ClerkApiBridge({ children }: { children: ReactNode }) {
  const auth = useAuth();

  const getToken = useCallback<GetTokenFn>(async () => {
    if (!auth.isSignedIn) return null;
    try {
      return await auth.getToken();
    } catch {
      return null;
    }
  }, [auth]);

  const value = useMemo<ClerkApiContext>(
    () => ({ getToken, tenantId: auth.orgId ?? null }),
    [getToken, auth.orgId],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
