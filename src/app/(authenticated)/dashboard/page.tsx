import { currentUser } from "@clerk/nextjs/server";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const isClerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_replace_me",
);

/**
 * Dashboard — home autenticada.
 *
 * Sprint 1 Wave 2: placeholder mínimo con saludo. El dashboard real (KPIs,
 * widgets, gráficos) llega en sprints siguientes una vez existan datos del
 * backend.
 *
 * Server Component: usa `currentUser()` de Clerk para personalizar el
 * saludo. En modo demo (sin Clerk) cae a "comercial".
 */
export default async function DashboardPage() {
  let greetingName = "comercial";
  if (isClerkConfigured) {
    const user = await currentUser();
    greetingName =
      user?.firstName ?? user?.username ?? user?.emailAddresses?.[0]?.emailAddress ?? "comercial";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Bienvenido, {greetingName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aquí verás tu pipeline, los leads asignados y las alertas de ATR. El
          dashboard se completará en los próximos sprints.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline</CardTitle>
            <CardDescription>
              Vista Kanban + Tabla + Timeline llegan en Sprint 2.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>ATR</CardTitle>
            <CardDescription>
              Estado de mensajes regulatorios en tiempo real (Sprint 4).
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tickets</CardTitle>
            <CardDescription>
              Inbox unificado WhatsApp + email + chat (Sprint 4).
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
