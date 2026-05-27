import type { ReactNode } from "react";
import { PortalTopbar } from "@/components/portal/portal-topbar";
import { DemoBanner } from "@/components/layout/demo-banner";

/**
 * Layout del Portal Cliente.
 *
 * Route group `(portal)` separado de `(authenticated)` -- el cliente
 * NO ve el sidebar del CRM, solo una topbar simplificada con logo +
 * nombre + logout.
 *
 * Auth: usa Clerk cuando configurado, misma logica que el CRM pero
 * con UI distinta (sin sidebar, sin cmd-k, sin AI chat).
 */
export default function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <DemoBanner />
      <PortalTopbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 px-4 py-6 md:px-8 md:py-8"
      >
        {children}
      </main>
    </div>
  );
}
