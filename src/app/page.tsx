/**
 * Landing temporal del scaffold. Sprint 2 reemplaza esta vista por la home del
 * CRM (dashboard + sidebar + topbar).
 */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-24">
        <h1 className="text-4xl font-semibold tracking-tight">
          Panda Energy — crm-energy-web
        </h1>
        <p className="text-muted-foreground">
          Scaffold inicial. La home del CRM se construye en Sprint 2.
        </p>
        <ul className="text-sm text-muted-foreground">
          <li>
            Variables de entorno: copia <code className="font-mono">.env.local.example</code> a{" "}
            <code className="font-mono">.env.local</code>.
          </li>
          <li>
            Tipos del backend: <code className="font-mono">pnpm gen:types</code>.
          </li>
          <li>
            Tokens visuales: <a className="underline" href="/_dev/tokens">/_dev/tokens</a>.
          </li>
        </ul>
      </section>
    </main>
  );
}
