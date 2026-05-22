# Performance — `crm-energy-web`

Documentación operativa de presupuestos de bundle, Lighthouse y procedimientos
de auditoría.

## Presupuesto (Definition of Done — F-6.7)

- **Lighthouse desktop** ≥ 85 en Performance / Accessibility / Best Practices /
  SEO en cada ruta crítica (`/leads`, `/pipeline`, `/sign-in`, `/dashboard`).
- **Web Vitals**:
  - LCP < 2.5 s.
  - CLS < 0.1.
  - INP < 200 ms.
- **First Load JS** ≤ 300 kB por ruta.

Si una PR rompe alguno de estos, DevOps configurará un check obligatorio en CI.
Mientras tanto, mantén estos números bajo control manualmente.

## Auditoría Lighthouse local

Lighthouse necesita Chrome instalado. En **WSL2 sin Chrome nativo** la ejecución
de `lighthouse https://localhost:3000` no es viable (no encuentra el browser).
En esos casos:

- **Opción A — Host Windows:** abre `http://localhost:3000` desde Edge/Chrome
  en Windows (apuntando al puerto WSL forwarded) y usa el panel de Lighthouse
  de DevTools. Genera el reporte y guárdalo en `docs/performance/reports/`.
- **Opción B — CI:** `lhci autorun` con GitHub Action `treosh/lighthouse-ci-action`
  (lo configura DevOps).
- **Opción C — Mac/Linux con Chrome:** instalar `npm i -g lighthouse` y correr:

```bash
# Arranca el dev server con MSW activo
NEXT_PUBLIC_API_MOCKING=enabled pnpm dev &

# En otra terminal:
lighthouse http://localhost:3000/leads \
  --view \
  --preset=desktop \
  --output=html \
  --output-path=./docs/performance/reports/leads-$(date +%Y%m%d).html

lighthouse http://localhost:3000/pipeline \
  --view \
  --preset=desktop \
  --output=html \
  --output-path=./docs/performance/reports/pipeline-$(date +%Y%m%d).html
```

> **Nota WSL2 actual:** este entorno no tiene Chrome instalado, por lo que
> el reporte se delega a DevOps en CI (Lighthouse CI). El comando queda
> documentado para correr localmente cuando se disponga de un browser real.

## Auditoría de bundle

```bash
pnpm build
# Lee la tabla "Route (app)" del output y compárala con bundle-baseline.md
```

Para inspeccionar qué hay dentro de un chunk grande:

```bash
ANALYZE=true pnpm build   # requiere setup de @next/bundle-analyzer (TBD)
```

DevOps puede configurar `@next/bundle-analyzer` opcional para PRs.

## Procedimiento ante regresión

1. **Detección.** Build local o CI marca una ruta sobre 300 kB.
2. **Diagnóstico.** Identifica el componente/dependencia nuevo. `git diff` del
   chunk afectado normalmente apunta al import culpable.
3. **Mitigación.**
   - Si es un componente de UI no crítico → `next/dynamic`.
   - Si es una librería pesada → considera alternativa más ligera o lazy.
   - Si es contexto IA (markdown renderer, code highlight) → defer a usuario.
4. **Verificación.** `pnpm build` para confirmar que vuelves al rango.
5. **Documenta.** Actualiza `bundle-baseline.md` con el snapshot post-fix.
