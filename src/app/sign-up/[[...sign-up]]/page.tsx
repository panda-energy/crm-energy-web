import { SignUp } from "@clerk/nextjs";

/**
 * /sign-up — flow Clerk full-page.
 *
 * Catch-all `[[...sign-up]]` para que Clerk gestione sus sub-rutas
 * (verificación de email, primer factor MFA, etc.).
 */
export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <SignUp />
    </main>
  );
}
