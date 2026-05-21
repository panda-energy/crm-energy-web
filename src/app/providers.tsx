"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { clerkAppearance } from "@/lib/auth/clerk-appearance";
import { MswProvider } from "@/mocks/MswProvider";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/lib/api/query-client";
import { ClerkApiBridge } from "@/lib/api/hooks/clerk-context";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured = Boolean(
  publishableKey && publishableKey !== "pk_test_replace_me",
);

/**
 * Providers globales. Vive como Client Component porque ClerkProvider y
 * next-themes son client-only. El RootLayout sigue siendo Server Component.
 *
 * Orden de wrappers (de fuera a dentro):
 *  1. ClerkProvider — sesión, organización, JWT.
 *  2. ClerkApiBridge — publica `getToken` + `tenantId` al cliente API.
 *  3. QueryProvider — TanStack Query con defaults curados.
 *  4. ThemeProvider (next-themes) — clase `.dark` en <html>.
 *  5. MswProvider — arranca worker MSW si flag activo (dev only).
 *  6. children — la app.
 *  7. Toaster — montado fuera del árbol para que persista cross-route.
 *
 * Degradación sin claves Clerk:
 *  Si `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` no está o usa el placeholder,
 *  saltamos `ClerkProvider` (y por tanto `ClerkApiBridge`). El hook
 *  `useClerkApiContext` cae a su default (`getToken: noop, tenantId: null`)
 *  y la app sirve MSW abierta.
 */
export function Providers({ children }: { children: ReactNode }) {
  const inner = (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <MswProvider>{children}</MswProvider>
      <Toaster />
    </ThemeProvider>
  );

  if (!isClerkConfigured) {
    // reason: dev sin claves Clerk; Console warning para que el dev sepa.
    if (typeof window !== "undefined") {
      console.warn(
        "[auth] Clerk publishable key ausente o placeholder; auth deshabilitada (modo demo).",
      );
    }
    return <QueryProvider>{inner}</QueryProvider>;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      localization={esES}
      appearance={clerkAppearance}
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in"}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up"}
    >
      <ClerkApiBridge>
        <QueryProvider>{inner}</QueryProvider>
      </ClerkApiBridge>
    </ClerkProvider>
  );
}
