import type { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SkipLink } from "@/components/layout/skip-link";
import { CommandPalette } from "@/components/command-palette/command-palette";

const isClerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_replace_me",
);

/**
 * Layout del CRM autenticado.
 *
 * - Route group `(authenticated)` no añade segmento a la URL pero permite
 *   compartir guard + chrome (sidebar/topbar) entre todas las rutas
 *   internas.
 * - `auth.protect()` redirige a `NEXT_PUBLIC_CLERK_SIGN_IN_URL` si no hay
 *   sesión. Solo lo invocamos cuando Clerk está configurado — en modo
 *   demo (sin claves) saltamos el guard y la app funciona con MSW.
 * - Estructura: Sidebar (sticky a la izquierda) + columna principal con
 *   Topbar (sticky arriba) + `<main>` con `id="main-content"` para el
 *   skip link.
 * - Accesibilidad: `<main role="main">`, skip link, focus order
 *   sidebar → topbar → main.
 */
export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (isClerkConfigured) {
    await auth.protect();
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <SkipLink />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 px-4 py-6 md:px-8 md:py-8"
        >
          {children}
        </main>
      </div>
      {/* Command palette global — el listener cmd+k está dentro. Vive
          fuera de <main> para que se monte una sola vez por sesión. */}
      <CommandPalette />
    </div>
  );
}
