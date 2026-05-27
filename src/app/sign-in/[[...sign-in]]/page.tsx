import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { Zap, BarChart3, Users, FileText, MessageSquare, Bot } from "lucide-react";

const isClerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_replace_me",
);

const DEMO_FEATURES = [
  { icon: Users, label: "Leads y Pipeline Kanban" },
  { icon: BarChart3, label: "CUPS y datos SIPS" },
  { icon: FileText, label: "Contratos y firma digital" },
  { icon: MessageSquare, label: "Tickets multicanal" },
  { icon: Bot, label: "Chat IA con herramientas" },
  { icon: Zap, label: "ATR regulatorio" },
] as const;

/**
 * /sign-in -- Clerk full-page sign-in flow.
 *
 * The catch-all `[[...sign-in]]` allows Clerk to route internally
 * (factor-one, verify, etc.) without Next intercepting.
 *
 * Demo mode: when Clerk keys are absent, a prominent demo splash is
 * shown with a clear CTA to enter the CRM with fictitious data.
 */
export default function SignInPage() {
  if (!isClerkConfigured) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-xl bg-brand text-brand-foreground">
              <Zap className="size-7" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Panda Energy
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                CRM IA-first para comercializadoras de energia
              </p>
            </div>

            <div className="w-full rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-left text-xs text-warning-foreground dark:text-warning">
              <p className="font-semibold">Modo demostracion</p>
              <p className="mt-0.5">
                No se requiere autenticacion. Los datos son ficticios y se
                reinician con cada recarga.
              </p>
            </div>

            <ul className="w-full space-y-2 text-left text-sm text-muted-foreground">
              {DEMO_FEATURES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5">
                  <Icon
                    className="size-4 shrink-0 text-brand"
                    aria-hidden="true"
                  />
                  <span>{label}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/dashboard"
              className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Entrar en modo demo
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <SignIn />
    </main>
  );
}
