import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Middleware Clerk para Next.js App Router.
 *
 * Rutas públicas (sin sesión):
 *   - `/` landing pública mientras no haya home autenticada
 *   - `/sign-in/**` y `/sign-up/**` flows de auth
 *   - `/api/webhooks/clerk/**` para webhooks futuros (sin firma de sesión)
 *
 * El resto de rutas se protegen con `auth.protect()` — Clerk redirige a
 * `NEXT_PUBLIC_CLERK_SIGN_IN_URL` si el usuario no tiene sesión.
 *
 * MULTI-TENANCY (regla cross-skill #1):
 *  El tenant ID se deriva del active organization de Clerk
 *  (`auth().orgId`). El wrapper API (`src/lib/api/client.ts`, Wave 3)
 *  inyecta el orgId resuelto en `x-tenant-id` o lo añade al JWT. Más
 *  detalles en `src/lib/auth/README.md`.
 *
 * DEGRADACIÓN sin claves:
 *  Si `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` no está definido o usa el
 *  placeholder de `.env.local.example`, Next monta el middleware igual
 *  pero `clerkMiddleware` lanza al evaluar `auth()`. Para evitar romper
 *  el dev experience, detectamos placeholder y deshabilitamos el guard.
 *  Esto está documentado en README.md → "Sin claves Clerk".
 */
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk(.*)",
]);

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured = Boolean(
  publishableKey && publishableKey !== "pk_test_replace_me",
);

export default isClerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) {
        await auth.protect();
      }
    })
  : // reason: cuando no hay claves Clerk, exponemos un middleware no-op.
    // Esto permite a dev arrancar la app con MSW (modo demo) sin tener
    // que registrarse en Clerk. NO usar en producción — DevOps debe
    // inyectar las claves reales en Doppler/Vercel antes de deploy.
    function noop() {
      return undefined;
    };

export const config = {
  matcher: [
    // Salta archivos internos de Next y assets estáticos.
    "/((?!_next/static|_next/image|favicon.ico|mockServiceWorker.js|.*\\.(?:png|jpg|jpeg|svg|gif|webp|woff2?|ttf)$).*)",
    // Pero SÍ corre en rutas API.
    "/(api|trpc)(.*)",
  ],
};
