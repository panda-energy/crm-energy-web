# Auth & multi-tenancy

Este paquete vive como documentación + helpers ligeros. La fuente de verdad
es **Clerk**: sesión, usuario, organización (= tenant) y JWT.

## Cómo se resuelve el tenant

Panda es **multi-tenant** (regla cross-skill #1). Cada tenant es una
`Organization` de Clerk. La membresía de un usuario en una organización
determina a qué tenant pertenece su sesión activa.

### Cliente (Server Component / Server Action)

```ts
import { auth } from "@clerk/nextjs/server";

const { userId, orgId, orgRole, orgSlug } = await auth();
// orgId es el tenant ID — pásalo al wrapper API.
```

### Cliente (Client Component)

```ts
"use client";
import { useAuth, useOrganization } from "@clerk/nextjs";

const { orgId } = useAuth(); // string | null | undefined
const { organization } = useOrganization();
```

### Cómo se propaga al backend (Wave 3)

El wrapper `useApi()` (F-1.8, próximo) construye cada request con dos cosas:

1. **`Authorization: Bearer <Clerk JWT>`** — Clerk firma el token con un
   template configurado. El backend verifica firma y extrae `org_id`.
2. **(opcional) `X-Tenant-Id: <orgId>`** — redundante con el JWT, pero útil
   para logging y para detectar mismatch entre claim y header (defensa en
   profundidad).

El backend NO debe confiar en headers HTTP para el tenant — la fuente
canónica es el claim `org_id` dentro del JWT verificado.

## Sin claves Clerk (modo dev)

Si `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` está vacío o usa el placeholder
`pk_test_replace_me`, el middleware degrada a un no-op (ver
`src/middleware.ts`). En ese modo:

- Las rutas autenticadas (`/(authenticated)/**`) **no protegen** — la app
  arranca con MSW (modo demo) y se ven datos sintéticos.
- `/sign-in` y `/sign-up` renderizan los componentes Clerk, que mostrarán
  un error en consola pero no romperán el resto del CRM.

Para activar Clerk real: copiar `pk_test_...` y `sk_test_...` del dashboard
Clerk → `.env.local`.

## Perfil interno: `useAuthMe()`

Una vez verificado el JWT, el backend resuelve el usuario interno asociado
a `clerk_user_id` y lo expone vía `GET /v1/auth/me`. El frontend lo
consume con:

```ts
import { useAuthMe, useDefaultPipelineId } from "@/lib/api/hooks/use-auth";

const { data: me } = useAuthMe();
// → me.id, me.tenant_id, me.role, me.default_pipeline_id, me.email, …
```

`useDefaultPipelineId()` es un atajo que devuelve `me.default_pipeline_id`
para hidratar el form de crear lead sin esperar a `usePipelines()`. Si la
sesión Clerk aún no tiene un user row interno (Clerk webhook no procesado),
el endpoint devuelve 404 y el hook entra en error state — el caller debe
degradar (banner "perfil aún provisionándose") en lugar de bloquear.

## Componentes UI relacionados

- `<UserButton>` — avatar + menú de perfil/logout. Lo renderiza la topbar.
- `<OrganizationSwitcher>` — cambio de tenant cuando el usuario es miembro
  de varias organizaciones. También en la topbar.
- `<SignIn>` / `<SignUp>` — flows full-page en rutas catch-all.

Todos toman `appearance` para estilizarse con tokens del design system; ver
`src/lib/auth/clerk-appearance.ts`.
