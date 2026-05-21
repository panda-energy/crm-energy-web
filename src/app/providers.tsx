"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { clerkAppearance } from "@/lib/auth/clerk-appearance";
import { MswProvider } from "@/mocks/MswProvider";
import { Toaster } from "@/components/ui/toaster";

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
 *  2. ThemeProvider (next-themes) — clase `.dark` en <html>.
 *  3. MswProvider — arranca worker MSW si flag activo (dev only).
 *  4. children — la app.
 *  5. Toaster — montado fuera del árbol para que persista cross-route.
 *
 * Degradación sin claves Clerk:
 *  Si `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` no está o usa el placeholder,
 *  saltamos `ClerkProvider` y devolvemos los hijos directamente. Los
 *  hooks `useAuth`/`useUser` lanzarán si se usan sin provider — por eso
 *  el layout autenticado (`app/(authenticated)/layout.tsx`) los usa solo
 *  detrás del guard `auth.protect()`, que con middleware no-op tampoco
 *  redirige. En modo demo (sin Clerk) la app sirve MSW data abierta.
 */
export function Providers({ children }: { children: ReactNode }) {
  const body = (
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
    return body;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      localization={esES}
      appearance={clerkAppearance}
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in"}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up"}
    >
      {body}
    </ClerkProvider>
  );
}
