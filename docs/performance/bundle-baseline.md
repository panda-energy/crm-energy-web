# Bundle baseline — `crm-energy-web`

Snapshot del tamaño del bundle por ruta (output de `pnpm build`).
Actualizar tras cada optimización significativa o cuando una regresión
saque una ruta del presupuesto.

**Presupuesto (DoD F-6.7):** First Load JS ≤ **300 kB** por ruta.
Si una ruta crece >10% en una PR, DevOps debe alertar (`bundle-size` action).

## Snapshot 2026-05-22 — Pre-optimización (commit `06ac366` mobile / `a62135d` web)

Stack: Next.js 15.5.18, React 19.0.0.

| Ruta                     | Size (kB) | First Load JS (kB) | Comentario                                     |
| ------------------------ | --------- | ------------------ | ---------------------------------------------- |
| `/`                      | 1.91      | 116                | Landing.                                       |
| `/_not-found`            | 0.998     | 103                | Shell mínimo.                                  |
| `/dashboard`             | 0.127     | 103                | Placeholder.                                   |
| **`/leads`**             | 0.148     | **295**            | Cerca del límite de 300 kB.                    |
| **`/leads/[leadId]`**    | 0.147     | **295**            | Mismo chunk que `/leads` (segmento dinámico).  |
| `/pipeline`              | 24.2      | 254                | Carga @dnd-kit + kanban.                       |
| `/sign-in/[[...sign-in]]`| 2.13      | 143                | Clerk.                                         |
| `/sign-up/[[...sign-up]]`| 2.13      | 143                | Clerk.                                         |
| **First Load shared**    | —         | **102**            | Chunks `345-` (46.1 kB) + `ba1e197f-` (54.2 kB).|

**Middleware:** 87.7 kB (auth.protect de Clerk).

### Diagnóstico

- `/leads` y `/leads/[leadId]` están en el borde del presupuesto (295/300). Las
  optimizaciones obvias buscan recuperar ~30-50 kB para ganar margen.
- `LeadsTimelineView`, `BulkActionBar` y `CommandPalette` siempre se cargan en
  el client bundle aunque solo se usen en condiciones específicas. Candidatos
  claros para `next/dynamic`.
- `@dnd-kit` ya está confinado a `/pipeline` — verificado por grep.
- `cmdk` es ligero (≤8 kB minified) pero arrastra `lucide-react` para iconos
  de items + handlers que no se necesitan hasta el primer `cmd+k`.

## Snapshot 2026-05-22 — Post-optimización dynamic imports

Cambios aplicados:

1. `LeadsTimelineView` → `next/dynamic(..., { ssr: false })`.
2. `BulkActionBar` → `next/dynamic` montado solo si `selectedIds.size > 0`
   (gate en el render del cliente; sin selección el chunk no se descarga).
3. `CommandPalette` → boundary `CommandPaletteBoundary` que registra un
   listener mínimo `mod+k` y monta el componente real (vía `next/dynamic`)
   solo al primer trigger del shortcut o del botón del topbar.

### Chunks generados

| Chunk                | Tamaño bruto | Componente diferido        |
| -------------------- | ------------ | -------------------------- |
| `389.*.js`           | ~6.5 kB      | LeadsTimelineView (+ parts)|
| `151.*.js`           | ~9.2 kB      | BulkActionBar              |
| `789.*.js`           | ~12.4 kB    | CommandPalette             |

### Tabla First Load JS

| Ruta                     | Antes (kB) | Después (kB) | Δ      |
| ------------------------ | ---------- | ------------ | ------ |
| `/`                      | 116        | 117          | +1     |
| `/_not-found`            | 103        | 104          | +1     |
| `/dashboard`             | 103        | 103          | 0      |
| `/leads`                 | 295        | **291**      | **−4** |
| `/leads/[leadId]`        | 295        | **291**      | **−4** |
| `/pipeline`              | 254        | 255          | +1     |
| `/sign-in/[[...sign-in]]`| 143        | 143          | 0      |
| `/sign-up/[[...sign-up]]`| 143        | 143          | 0      |
| First Load shared        | 102        | 103          | +1     |

### Lectura honesta del resultado

El ahorro en First Load JS es **modesto** (−4 kB en `/leads`). Esto se debe
a que:

- El runtime de `next/dynamic` añade ~1 kB al shared chunk.
- Los chunks separados (Timeline 6.5 kB, BulkActionBar 9 kB, CommandPalette
  12 kB) **sí** dejan de estar en el First Load — pero gran parte de su peso
  ya era compartido con `LeadsTable` (Radix, lucide-react) y por eso el
  delta neto es pequeño.
- El cmdk Palette estaba en el layout chunk junto al sidebar/topbar; al
  moverlo a un chunk lazy, el shared baja unos cientos de bytes pero la
  ganancia se enmascara con el overhead de runtime de `dynamic`.

**Beneficio real medible**:

- `/leads` baja 4 kB (queda en 291 kB; antes 295 — margen sobre 300 kB
  pasa de 5 a 9 kB).
- **Tiempo a interactivo** mejora más que el bundle size: la palette y la
  bulk bar ya no parsean ni evalúan JS en el primer render. Eso lo veremos
  en Lighthouse (cuando DevOps lo conecte en CI), no en First Load JS.

### Conclusión

Los dynamic imports son una **defensa frente al crecimiento** más que una
reducción agresiva del bundle actual. Mantenerlos evita que `/leads`
cruce el límite de 300 kB cuando se añadan funciones nuevas (chat IA
lateral, gráficos del Pipeline) que también arrastren Radix.

Si tras el Sprint 4 alguna ruta vuelve a acercarse a 300 kB, las próximas
intervenciones serían:

- Sustituir `lucide-react` por `lucide-react/icons/<name>` import puntual
  (savings esperados ~10-20 kB).
- Verificar tree-shaking de `date-fns` (usar `date-fns/<fn>` específicos).
- Considerar `@radix-ui/react-*` selective: hoy estamos usando 12 paquetes
  Radix; si alguno duplica funcionalidad consolidar.

## Cómo regenerar este snapshot

```bash
cd crm-energy-web
pnpm install --frozen-lockfile
pnpm gen:types
pnpm build
# Pega la tabla de "Route (app)" en este documento, sección "Snapshot YYYY-MM-DD".
```

Si la regresión empuja una ruta sobre 300 kB:

1. Identifica la ruta y el delta.
2. Inspecciona el chunk con `next build --debug` o `@next/bundle-analyzer`.
3. Aplica `next/dynamic` a componentes que no son crítico-render.
4. Si la regresión viene de una dependencia, abre issue de bundle a DevOps.
