/**
 * /dev/tokens — visualización de design tokens.
 *
 * Esta página es TEMPORAL (Sprint 1). Se elimina en cuanto Storybook esté
 * listo. Sirve para validar contraste manualmente con axe DevTools.
 *
 * NOTA: Tailwind v4 (JIT) no detecta clases dinámicas tipo `bg-${name}`,
 * así que las escribimos literales aquí. Esa restricción NO aplica al resto
 * de la app, que usa nombres semánticos directos (`bg-brand`, `text-danger`).
 */

interface SwatchProps {
  label: string;
  className: string;
}

function SwatchCard({ label, className }: SwatchProps) {
  return (
    <div
      className={`${className} flex h-24 flex-col justify-between rounded-md border border-border p-4`}
    >
      <span className="font-mono text-xs uppercase tracking-wide">{label}</span>
      <span className="text-sm">Aa — contenido</span>
    </div>
  );
}

export default function TokensDevPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-12 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Design tokens</h1>
        <p className="text-muted-foreground">
          Página temporal para validar tokens visualmente. Eliminar cuando
          Storybook esté en marcha.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Superficies</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <SwatchCard label="background" className="bg-background text-foreground" />
          <SwatchCard label="surface" className="bg-surface text-surface-foreground" />
          <SwatchCard label="muted" className="bg-muted text-muted-foreground" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Brand</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <SwatchCard label="brand" className="bg-brand text-brand-foreground" />
          <SwatchCard label="secondary" className="bg-secondary text-secondary-foreground" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Semánticos</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <SwatchCard label="success" className="bg-success text-success-foreground" />
          <SwatchCard label="warning" className="bg-warning text-warning-foreground" />
          <SwatchCard label="danger" className="bg-danger text-danger-foreground" />
          <SwatchCard label="info" className="bg-info text-info-foreground" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Tipografía</h2>
        <div className="space-y-2 rounded-md border border-border bg-surface p-6">
          <p className="text-5xl">Display 5xl — Panda Energy</p>
          <p className="text-4xl">Heading 4xl</p>
          <p className="text-3xl">Heading 3xl</p>
          <p className="text-2xl">Heading 2xl</p>
          <p className="text-xl">Heading xl</p>
          <p className="text-lg">Body lg</p>
          <p className="text-base">Body base — texto cuerpo principal.</p>
          <p className="text-sm text-muted-foreground">Body sm — meta.</p>
          <p className="font-mono text-xs">monospace xs — código</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Radii</h2>
        <div className="flex flex-wrap gap-4">
          <div className="h-16 w-16 rounded-sm border border-border bg-muted" title="radius-sm" />
          <div className="h-16 w-16 rounded-md border border-border bg-muted" title="radius-md" />
          <div className="h-16 w-16 rounded-lg border border-border bg-muted" title="radius-lg" />
          <div className="h-16 w-16 rounded-xl border border-border bg-muted" title="radius-xl" />
          <div className="h-16 w-16 rounded-full border border-border bg-muted" title="radius-full" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Sombras</h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <div className="h-24 rounded-md bg-surface p-4 shadow-1">
            <span className="font-mono text-xs uppercase">shadow-1</span>
          </div>
          <div className="h-24 rounded-md bg-surface p-4 shadow-2">
            <span className="font-mono text-xs uppercase">shadow-2</span>
          </div>
          <div className="h-24 rounded-md bg-surface p-4 shadow-3">
            <span className="font-mono text-xs uppercase">shadow-3</span>
          </div>
          <div className="h-24 rounded-md bg-surface p-4 shadow-4">
            <span className="font-mono text-xs uppercase">shadow-4</span>
          </div>
        </div>
      </section>
    </main>
  );
}
