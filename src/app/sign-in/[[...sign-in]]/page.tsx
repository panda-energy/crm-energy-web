import { SignIn } from "@clerk/nextjs";

/**
 * /sign-in — flow Clerk full-page.
 *
 * El catch-all `[[...sign-in]]` permite a Clerk router internamente sus
 * sub-rutas (factor-one, verify, etc.) sin que Next intercepte.
 *
 * Sin claves Clerk (`pk_test_replace_me`), `<SignIn>` no monta y verás un
 * mensaje en consola. El resto del CRM sigue funcional con MSW.
 */
export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <SignIn />
    </main>
  );
}
