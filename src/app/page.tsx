import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Landing pública mínima. En Wave 3+ se sustituye por una landing real
 * (o se redirige a `/dashboard` cuando hay sesión Clerk activa).
 */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-24">
        <h1 className="text-4xl font-semibold tracking-tight">Panda Energy</h1>
        <p className="text-muted-foreground">
          CRM IA-first para comercializadoras de energía. Sprint 1 — chasis
          del producto. Sprint 2 estrena el pipeline.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard">Ir al CRM</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/sign-in">Iniciar sesión</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
