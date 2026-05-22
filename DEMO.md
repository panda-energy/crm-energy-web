# Demo Panda Energy CRM — Web

> Modo demo: MSW intercepta el backend con fixtures locales y Clerk degrada a
> no-op (cero registros, cero login). Diseñado para arrancar en **60 segundos**
> y vender en **10–12 minutos**.

---

## Cómo arrancar (60 segundos)

```bash
cd crm-energy-web
cp .env.local.demo .env.local        # template explícito sin claves Clerk
pnpm install                         # idempotente; ~1s con lockfile
pnpm dev                             # arranca Next 15 en :3000
```

Abrir <http://localhost:3000> y pulsar **"Ir al CRM"**.

Si el puerto 3000 está ocupado: `pnpm dev -- -p 3001`.

> Tip de demo: si quieres arrancar más rápido y con assets optimizados,
> usa `pnpm build && pnpm start` en lugar de `pnpm dev`. Saltas la
> compilación al primer click.

---

## Qué verás (modo demo)

- **Auth desactivada.** Clerk degrada a no-op porque `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  está ausente. La consola del navegador lo anuncia con un warning gris.
- **MSW activo.** El service worker `mockServiceWorker.js` intercepta toda
  llamada a `/v1/*` y responde con fixtures (50 leads ES, 2 pipelines,
  8 usuarios, ~100 actividades). La pestaña Network del navegador lo
  confirma.
- **Cero red real.** `NEXT_PUBLIC_API_URL` es irrelevante con MSW activo.

---

## Guion (10–12 minutos)

### Paso 1 — Arranque + Dashboard (30 s)

- Abrir `/` → click "Ir al CRM" → aterriza en `/dashboard`.
- Mostrar sidebar (Leads, Pipeline, Tickets, Contratos, Comisiones, etc.)
  y topbar con OrganizationSwitcher + toggle de dark mode.
- **Qué decir:** "Chasis Linear-style. Densidad alta, cero scroll horizontal,
  todo accesible por teclado. Es lo que un comercial usa 8 horas al día."

### Paso 2 — Listado de Leads (1 min)

- Sidebar → **Leads** (o navegar a `/leads`).
- Mostrar tabla con **15 leads** de fixture, sidebar de filtros a la
  izquierda (search, status, source, pipeline, stage, tags, fechas),
  paginación inferior, sort en columnas whitelisted (nombre, creado,
  estado).
- Cambia un filtro de status → la URL se actualiza (`?status=qualified`).
- **Qué decir:** "Filtros server-side, URLs compartibles. Un comercial
  puede mandar a su jefe el link de 'mis leads cualificados de esta semana'
  por Slack y abre el mismo estado exacto."

### Paso 3 — Selección bulk con shift-click (45 s)

- Click checkbox de la primera fila → shift-click la 4ª → 4 leads
  seleccionados.
- Aparece **barra flotante** en la parte inferior con acciones
  (cambiar owner, cambiar stage, eliminar).
- Cambia un filtro → la selección persiste cross-página.
- **Qué decir:** "Selección persistente cross-page. Linear/Attio style.
  Si tu pipeline tiene 200 leads y quieres reasignar 30, no pierdes la
  selección al paginar."

### Paso 4 — Command Palette (cmd-K) (1 min)

- Pulsar `⌘+K` (o `Ctrl+K` en Windows/Linux).
- Mostrar acciones rápidas: **Crear lead**, **Ir a Pipeline**,
  **Ir a Dashboard**.
- Empezar a escribir "Mar" → búsqueda en vivo (debounce 200 ms) que
  consulta MSW y devuelve leads coincidentes.
- Cerrar y reabrir → muestra **recientes** (en localStorage).
- **Qué decir:** "Linear/Attio-style command palette. Cero clicks para
  navegar o crear leads. El comercial veterano nunca toca el mouse."

### Paso 5 — Crear lead (1 min 30 s)

- ⌘+K → "Crear lead" → se abre Sheet derecho de **448 px**.
- Form con React Hook Form + Zod. Demostrar validación inline:
  - Email malformado → error rojo "Email inválido".
  - Phone sin `+` → error "Formato E.164 requerido (ej. +34600123456)".
- Rellenar válido → Submit → toast verde "Lead creado" con botón **"Ver"**.
- Click "Ver" → navega al detalle.
- **Qué decir:** "Validación E.164 estricta en el cliente. El comercial
  no descubre que el teléfono está mal cuando intenta hacer la primera
  llamada — lo descubre al teclearlo."

### Paso 6 — Detalle del lead (1 min 30 s)

- Sheet derecho de **640 px** con tabs **Info / Actividades / Notas**.
- En **Info**:
  - Cambiar empresa inline → blur → optimistic update.
  - Cambiar status de "Nuevo" a "Contactado" → optimistic + toast
    con botón **Deshacer** (6 s).
  - Añadir un tag → chip aparece al instante.
- **Qué decir:** "Optimistic UI con undo de 6 segundos. El backend
  confirma en background; si falla, revertimos automáticamente y
  mostramos el error. La sensación es la de Linear: instantáneo."

### Paso 7 — Actividades discriminadas (1 min)

- Tab **Actividades**. Mostrar timeline con variantes diferenciadas:
  - `note` → bloque con autor + timestamp relativo.
  - `stage_changed` → "De **Nuevo** a **Contactado**" con flecha.
  - `owner_changed` → "Reasignado a **Lucía Méndez**" (nombre resuelto
    desde el cache de usuarios).
  - `whatsapp_inbound` / `whatsapp_outbound` → burbujas estilo chat.
- **Qué decir:** "13 variantes de actividad con render dedicado. El
  histórico no es un blob de JSON — es una narrativa visual del lead."

### Paso 8 — Eliminar con undo (1 min)

- Detalle del lead → botón eliminar (icono basura).
- Aparece confirm modal con copy **específico**:
  > "Eliminar **María García López**. Esta acción no se puede deshacer."
- Confirm → toast amarillo "Lead eliminado" con botón **Deshacer** (6 s).
- Click **Deshacer** → toast verde "Restaurado". El lead vuelve a la lista.
- **Qué decir:** "Undo elegante. Reduce el miedo a equivocarse y por
  tanto la fricción. El comercial actúa rápido porque sabe que cualquier
  cagada se deshace en un click."

### Paso 9 — Vista Timeline (1 min)

- Volver a `/leads`. En el header arriba a la derecha, toggle
  **Tabla / Timeline**.
- Click Timeline → leads agrupados **por mes en castellano** ("Mayo 2026").
- Mostrar badges de estancamiento: rojo "**Sin contacto 23 días**".
- **Qué decir:** "Misma data, dos vistas. Tabla para escanear masivamente;
  Timeline para entender el flujo temporal. Los badges de estancamiento
  saltan a la vista de los leads olvidados — diferenciador frente a
  HubSpot."

### Paso 10 — Pipeline Kanban (1 min 30 s)

- Sidebar → **Pipeline** (o `/pipeline`).
- Mostrar 5 columnas: **Nuevo / Contactado / Cualificado / Ganado / Perdido**.
- Arrastrar una card de "Contactado" a "Cualificado" → optimistic move
  inmediato + request POST en background.
- Soltar entre dos cards específicas → la posición se respeta.
- **Qué decir:** "Drag & drop con `@dnd-kit`. Position respetada al
  soltar entre dos cards. Optimistic — el comercial no espera al
  servidor para reorganizar."

### Paso 10b — Roadmap visible (30 s)

- Sidebar → click **CUPS / Contratos / ATR / Tickets / Comisiones /
  Configuración**. Cada ruta renderiza un placeholder con icono,
  descripción y **badge "Disponible en Sprint X"** + 3-5 bullets
  concretos de qué traerá.
- **Qué decir:** "El roadmap está dentro del producto, no en un slide
  aparte. El observador ve dónde estamos hoy, qué llega en Sprint 3
  (CUPS + Contratos), Sprint 4 (ATR + Tickets) y Sprint 5-6
  (Comisiones + Configuración). Cero promesas vagas."

### Paso 11 — Dark mode (30 s)

- Topbar → toggle luna/sol → toda la app cambia a dark mode (system,
  light, dark).
- Pasar por `/leads`, `/pipeline`, abrir el detalle → todo consistente
  porque usamos design tokens.
- **Qué decir:** "Dark mode por design tokens, no por overrides. Mismo
  componente, mismo CSS, distinta paleta. Accesible AA en ambos modos."

### Paso 12 — Storybook (opcional, 1 min)

- En otra terminal: `pnpm storybook` (`:6006`).
- Mostrar 17 historias con estados **default / loading / error / empty
  / disabled / variants**.
- **Qué decir:** "El design system está catalogado. Cualquier dev nuevo
  ve qué componentes existen y en qué estados antes de tocar la app."

---

## Solución de problemas

- **MSW no intercepta** → verificar `NEXT_PUBLIC_API_MOCKING=enabled`
  en `.env.local`. Abrir DevTools → Application → Service Workers; debe
  aparecer `mockServiceWorker.js` activo. Si no aparece, hard refresh
  (Cmd+Shift+R).
- **Clerk pide login** → modo demo arranca sin claves. Si aparece la
  pantalla de Clerk, alguna variable `NEXT_PUBLIC_CLERK_*` se filtró
  del shell. Eliminar del entorno: `unset NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  y reiniciar `pnpm dev`. Confirmar también que `.env.local` no la
  contiene.
- **Puerto 3000 ocupado** → `pnpm dev -- -p 3001`.
- **Pantalla en blanco al cargar** → MSW arranca en `useEffect` y bloquea
  el render hasta que el worker esté listo. Si tarda > 5 s, revisar
  consola del navegador (errores rojos). Suele ser un service worker
  zombi de otra app en el mismo dominio: DevTools → Application →
  Service Workers → Unregister all.
- **Bundle lento en dev** → la primera carga compila on-demand. Para una
  demo con assets ya optimizados: `pnpm build && pnpm start`
  (`NEXT_PUBLIC_API_MOCKING=enabled` debe seguir en `.env.local`).
- **Console warning `[auth] Clerk publishable key ausente...`** → esto
  es **esperado** en modo demo. No es un error.
- **Iconos / favicons default de Next** → TODO de diseño; no bloquea
  demo.

---

## Apéndice — Comandos de verificación rápida

```bash
# Smoke server-side (cuando arranca pnpm dev en :3000)
for r in / /dashboard /leads /pipeline /cups /contracts /atr /tickets /commissions /settings /sign-in; do
  printf "%-15s %s\n" "$r" "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000$r)"
done
# Todas las rutas deben devolver 200.

# Validación de calidad (todo verde)
pnpm typecheck   # tsc --noEmit
pnpm lint        # next lint
pnpm test        # vitest run — 163 tests pasan
pnpm build       # next build
```
