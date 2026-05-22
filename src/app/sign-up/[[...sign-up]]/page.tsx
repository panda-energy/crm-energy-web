import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

const isClerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_replace_me",
);

/**
 * /sign-up — flow Clerk full-page.
 *
 * Catch-all `[[...sign-up]]` para que Clerk gestione sus sub-rutas
 * (verificación de email, primer factor MFA, etc.).
 *
 * Modo demo: sin claves Clerk se sirve una pantalla informativa.
 */
export default function SignUpPage() {
  if (!isClerkConfigured) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
          <p className="text-2xl font-bold text-brand">Panda Energy</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Modo demo activo — no se requiere registro.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:opacity-90"
          >
            Entrar al CRM
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <SignUp />
    </main>
  );
}
