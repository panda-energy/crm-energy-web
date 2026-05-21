/**
 * SkipLink — enlace de acceso directo al contenido principal.
 *
 * Cumple WCAG 2.4.1 (Bypass Blocks). Oculto visualmente hasta que recibe
 * focus por teclado (Tab al cargar la página). Apunta a `#main-content`.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-foreground focus:shadow-3 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
    >
      Saltar al contenido
    </a>
  );
}
