# crm-energy-web

Frontend web de **Panda Energy** — CRM IA-first multi-tenant para comercializadoras
de energía. Construido con **Next.js 15 (App Router)**, **React 19**,
**Tailwind CSS 4**, **TanStack Query 5** y **Clerk** para auth.

> **Estado:** Sprint 2 (Wave 0). Sprint 1 cerrado (scaffold + OpenAPI stub +
> MSW + design tokens + componentes shadcn + Clerk + layout CRM + wrapper
> API tipado + Storybook). Sprint 2 Wave 0 sincroniza el contrato con el
> OpenAPI real publicado por el backend (16 endpoints: leads CRUD + bulk +
> move + activities + WhatsApp + pipelines + stages).

---

## Onboarding desarrollador frontend

### Requisitos

- Node.js **>= 20.11** (probado con 24.15.0).
- **pnpm 11.1.3** (declarado en `packageManager`). Si no lo tienes, corepack
  lo descargará automáticamente; si no hay corepack:
  `npm install -g pnpm@11.1.3`.

### Pasos

1. `pnpm install`.
2. Copia `.env.local.example` → `.env.local` y rellena los placeholders.
   - Para arrancar sin backend basta con dejar Clerk vacío (auth se activa en
     Sprint 2) y mantener `NEXT_PUBLIC_API_MOCKING=enabled`.
3. `pnpm gen:types` — regenera `src/lib/api/types.ts` desde
   `openapi/openapi.json`. El archivo está commiteado para que el repo
   arranque sin backend live, pero **siempre** regenérelo después de cambiar
   el OpenAPI (o cuando el backend publique una versión nueva).
4. `pnpm msw:init public/` — instala el service worker en `public/` (se hace
   una sola vez; el archivo queda commiteado).
5. `pnpm dev` → http://localhost:3000.
   - Landing pública: `/`.
   - Sign in / sign up (Clerk): `/sign-in`, `/sign-up`.
   - Dashboard CRM autenticado: `/dashboard`.
   - El visualizador temporal de tokens (`/dev/tokens`) se retiró al final de
     Wave 2; Storybook (Wave 3) lo sustituye.
6. `pnpm test` y `pnpm typecheck` deben pasar en verde.

### Modo demo (sin claves Clerk)

Si dejas `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_replace_me` en
`.env.local`, la auth se desactiva y el middleware se vuelve no-op. La app
sirve datos sintéticos via MSW. Las páginas `/sign-in` y `/sign-up`
renderizan los componentes Clerk pero NO completarán el flow — solo te
muestran un error en consola. Útil para arrancar sin registrarse.

Si el setup tarda **> 45 min**, repórtalo como blocker P0.

---

## Scripts

| Script | Qué hace |
|---|---|
| `pnpm dev` | Next dev server, puerto 3000. |
| `pnpm build` | Build de producción. |
| `pnpm start` | Sirve el build (no se usa en dev). |
| `pnpm typecheck` | `tsc --noEmit` en modo strict. |
| `pnpm lint` | ESLint. |
| `pnpm test` | Vitest (unit + smoke MSW). |
| `pnpm test:watch` | Vitest en modo watch. |
| `pnpm gen:types` | Regenera tipos desde `openapi/openapi.json`. |
| `pnpm msw:init` | Reinstala `public/mockServiceWorker.js`. |
| `pnpm format` | Prettier write. |
| `pnpm format:check` | Prettier check (CI). |
| `pnpm storybook` | Storybook dev server, puerto 6006. |
| `pnpm build-storybook` | Storybook estático → `storybook-static/`. |

---

## Convenciones técnicas (no negociables)

Ver `.agents/frontend/AGENT.md` para la lista completa. Resumen operativo:

- **TypeScript strict.** Cero `any`, cero `as unknown as` sin justificación
  `// reason:`.
- **Tipos del backend** salen exclusivamente de `src/lib/api/types.ts`, que
  se **genera** con `pnpm gen:types`. **No editar a mano.**
- **TanStack Query** para server state. **Zustand** para UI state. No Redux,
  no `useEffect` para fetch.
- **App Router**, Server Components donde aplique. Server Actions solo para
  mutaciones simples; flujos complejos por TanStack Query.
- **shadcn/ui copiado al repo** en `src/components/ui/`, **no es dependencia**
  de `package.json`. La CLI (`pnpm dlx shadcn@latest add ...`) se ejecuta a
  demanda; los archivos generados quedan commiteados.
- **Tokens, no colores hardcoded.** Todas las clases Tailwind referencian
  variables CSS definidas en `src/app/globals.css` (`bg-brand`, `text-danger`,
  etc.). Si necesitas un token nuevo, añádelo al CSS + a `design-tokens.json`.
- **WCAG 2.2 AA** en todo lo que se mergea. Probado con teclado y axe.
- Componentes con **>300 líneas → partir**.

---

## OpenAPI + MSW

El backend FastAPI publica su esquema OpenAPI en
`crm-energy-backend/contracts/openapi.snapshot.json` (snapshot versionado en
ese repo). Este repo:

1. **Copia** ese snapshot a `openapi/openapi.json`. **Es la fuente de verdad
   del contrato cliente** y, salvo error, debe ser bit-a-bit idéntico al del
   backend.
2. Genera `src/lib/api/types.ts` con `openapi-typescript` (commiteado para
   que el repo arranque sin pipeline live).
3. Sirve respuestas sintéticas con **MSW** (`src/mocks/`) cuando
   `NEXT_PUBLIC_API_MOCKING=enabled`.

### Sincronización con backend

Cuando el backend actualiza su contrato (nuevo endpoint, cambio de schema,
nuevo enum) **el frontend debe resincronizar** antes de usarlo. Hasta que
DevOps automatice el paso desde CI, el flujo es manual:

```bash
cp ../crm-energy-backend/contracts/openapi.snapshot.json openapi/openapi.json
pnpm gen:types
pnpm typecheck   # detecta breaking changes en consumidores
```

**Reglas:**

- **Nunca editar `openapi/openapi.json` a mano**: se sobrescribe al
  resincronizar y pierdes los cambios. Si necesitas un campo/endpoint nuevo,
  abrir issue al agente Backend.
- **`src/lib/api/types.ts` se commitea pero no se edita a mano** — lo regenera
  `pnpm gen:types`.
- **`src/lib/api/zod-schemas.ts`** vive aparte: son schemas Zod de
  **boundary validation** que se mantienen manualmente sincronizados con
  `LeadOut`, `PipelineOut`, etc. Si rompen compat con los tipos generados,
  el typecheck del array `_compatibilityChecks` lo detecta.

### Cobertura MSW vs backend real

MSW **espeja el comportamiento del backend para los endpoints más usados
del CRM** (leads CRUD + bulk + move + activities, pipelines list/get/stages,
auth/me). No es exhaustivo: WhatsApp send y webhooks no están mockeados
(Sprint 2 se prueban contra backend real). Para dev contra backend real:

```bash
NEXT_PUBLIC_API_MOCKING=disabled
NEXT_PUBLIC_API_URL=http://localhost:8000   # FastAPI dev
```

Y arrancar el backend en su repo (ver `crm-energy-backend/README.md`).

MSW **se queda** para tests (deterministas, no dependen de red).

### Activar/desactivar MSW

- En dev: `NEXT_PUBLIC_API_MOCKING=enabled` arranca el worker. Cualquier otro
  valor (o ausencia) lo deja apagado.
- En tests Vitest: siempre activo, vía `tests/setup.ts`.
- En producción: nunca se carga (el import es dinámico y condicional).

---

## Variables de entorno

Ver `.env.local.example`. Las que introduce este sprint:

| Variable | Quién la usa | Notas |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Web (cliente) | Sprint 2 activa Clerk. |
| `CLERK_SECRET_KEY` | Web (server) | Sprint 2 activa Clerk. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` etc. | Web | Defaults documentados. |
| `NEXT_PUBLIC_API_URL` | Web | URL del backend (Railway). |
| `NEXT_PUBLIC_API_MOCKING` | Web | `enabled` → arranca MSW. |

DevOps las propaga vía **Doppler / Vercel** a staging y producción.

---

## Notas de compatibilidad / blockers conocidos

- **Tailwind CSS 4 estable (4.0.0)** — config principal vive en
  `src/app/globals.css` (`@theme inline`). El `tailwind.config.ts` queda
  reducido a `darkMode: ['class']` y `content` para IDE.
- **Next 15 + React 19** — versiones pinneadas (`next 15.1.3`, `react 19.0.0`).
  Si Vercel reporta incompatibilidades con dependencias añadidas en Sprint 2
  (Clerk, Storybook), se documentará aquí.
- **shadcn CLI** — todavía no se ha corrido (`components.json` ya
  configurado). Cuando Sprint 2 importe componentes shadcn (`Input`, `Select`,
  `Dialog`…), se hará con `pnpm dlx shadcn@latest add <componente>`.

---

## Estructura del repo

```
crm-energy-web/
├── openapi/
│   └── openapi.json           # Copia del snapshot del backend (no editar).
├── public/
│   └── mockServiceWorker.js   # Generado por `pnpm msw:init`.
├── src/
│   ├── middleware.ts          # Clerk middleware (no-op si no hay claves).
│   ├── app/                   # App Router.
│   │   ├── layout.tsx         # Root layout + Providers.
│   │   ├── providers.tsx      # ClerkProvider + ThemeProvider + MSW + Toaster.
│   │   ├── page.tsx           # Landing pública.
│   │   ├── globals.css        # Tokens + Tailwind v4 + keyframes Radix.
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   ├── sign-up/[[...sign-up]]/page.tsx
│   │   └── (authenticated)/   # Route group — guard Clerk + chrome CRM.
│   │       ├── layout.tsx     # Sidebar + Topbar + main.
│   │       └── dashboard/page.tsx
│   ├── components/
│   │   ├── ui/                # shadcn/ui copiado al repo.
│   │   └── layout/            # Sidebar, Topbar, Breadcrumbs, ThemeToggle.
│   ├── lib/
│   │   ├── api/types.ts       # Generado — NO editar.
│   │   ├── auth/              # README multi-tenancy + appearance Clerk.
│   │   ├── ui/                # Stores Zustand + nav config.
│   │   └── utils/cn.ts
│   └── mocks/
│       ├── handlers.ts
│       ├── browser.ts
│       ├── server.ts
│       ├── MswProvider.tsx
│       └── fixtures/leads.ts
├── tests/
│   ├── setup.ts
│   └── msw-smoke.test.ts
├── components.json            # Config shadcn.
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Storybook

Storybook 9 con framework `@storybook/nextjs-vite` (Vite builder, ~3× más
rápido que webpack5 en arranque y HMR). Decisión técnica: subimos a
Storybook 9 en lugar de la 8 inicialmente prevista porque `@storybook/nextjs`
8.x rompe contra el webpack interno empaquetado por Next 15 + React 19
(`TypeError: Cannot read properties of undefined (reading 'tap')`).
Storybook 9 es la primera línea estable con peers compatibles con Next 15.

- Config: `.storybook/main.ts` + `.storybook/preview.tsx`.
- Stories: `src/**/*.stories.tsx`. Cada componente del DS tiene su story
  con estados default/loading/error/empty/disabled/variants según aplique.
- Addons: `addon-docs` (autodocs MDX + controls), `addon-a11y`
  (auditoría WCAG), `addon-themes` (toggle dark/light).

### Visual regression baseline (Chromatic)

El baseline visual lo activa **DevOps** publicando el proyecto en Chromatic
y enganchando el workflow en `crm-energy-infra`. Esta repo entrega las
stories y el `pnpm build-storybook` verde; DevOps añade el token de
Chromatic, el addon `@chromatic-com/storybook` y el step de CI. Hasta
entonces, el baseline visual no se ejecuta automáticamente.

## Para DevOps

Cuando configures CI:

```bash
pnpm install --frozen-lockfile
pnpm gen:types
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm build-storybook
```

Variables de entorno que necesitarán Doppler/Vercel: ver tabla arriba.
