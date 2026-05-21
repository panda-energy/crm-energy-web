/**
 * client.ts — cliente HTTP base para la API de Panda Energy.
 *
 * Por qué un cliente custom y no un wrapper de fetch suelto:
 *  1. **Inyecta auth** (Bearer JWT de Clerk) sin que cada caller tenga que
 *     pensarlo.
 *  2. **Inyecta `X-Tenant-Id`** redundante con el JWT como defensa en
 *     profundidad — ver `src/lib/auth/README.md`. El backend SIGUE confiando
 *     en el claim `org_id` del JWT, no en el header.
 *  3. **Inyecta `X-Correlation-Id`** generado por request (UUIDv4) para que
 *     todo el viaje request → backend logs → Sentry esté enlazado.
 *  4. **Inyecta `Idempotency-Key`** cuando el caller lo pide (regla cross-skill
 *     #2). Soporta `'auto'` que genera UUIDv4 y `string` explícito (útil cuando
 *     el caller persiste su propio key para reintentos).
 *  5. **Convierte errores a `ApiError`** uniformemente para que TanStack Query
 *     pueda decidir retries en base a `error.status` sin parsear cuerpos.
 *  6. **NO importa Clerk en server vs client** — el caller pasa `getToken` ya
 *     resuelto. Esto evita un acoplamiento que rompería tests Vitest y SSR.
 *
 * El cliente funciona en Server Components (donde se usaría
 * `auth().getToken()` de `@clerk/nextjs/server`) y Client Components (donde
 * se usa `useAuth().getToken()` de `@clerk/nextjs`). Los hooks de
 * `src/lib/api/hooks/` se encargan de cablear `getToken` apropiadamente.
 */
import { apiErrorFromResponse } from "./error";

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

/**
 * Función que devuelve el JWT de Clerk para la request actual.
 * En client → `() => getToken()` del hook `useAuth`.
 * En server → `() => (await auth()).getToken()`.
 * En modo demo (sin Clerk) → `null` y el cliente omite el header Authorization.
 */
export type GetTokenFn = () => Promise<string | null>;

export interface ApiRequestOptions {
  /** Resuelve el JWT (o null si modo demo / sin sesión). */
  getToken?: GetTokenFn;
  /** Tenant ID (org de Clerk). Se inyecta como `X-Tenant-Id`. */
  tenantId?: string | null;
  /** Query params; se serializan a URLSearchParams. `undefined` se omite. */
  query?: Record<string, string | number | boolean | undefined>;
  /**
   * Idempotency-Key:
   *  - `string` → se manda tal cual.
   *  - `'auto'` → se genera UUIDv4.
   *  - omitido → no se envía el header.
   * Solo aplicable a métodos no-GET.
   */
  idempotencyKey?: string | "auto";
  /** Path params para sustituir `{name}` en la ruta. */
  pathParams?: Record<string, string | number>;
  /** Headers adicionales (se mezclan con los inyectados, sin sobreescribirlos). */
  headers?: Record<string, string>;
  /** AbortSignal para cancelación. TanStack Query lo provee. */
  signal?: AbortSignal;
}

/**
 * Construye la URL final juntando base + path con path/query params.
 */
function buildUrl(path: string, opts: ApiRequestOptions): string {
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  // Sustitución de path params: `/leads/{leadId}` → `/leads/abc`.
  let resolved = path;
  if (opts.pathParams) {
    for (const [key, value] of Object.entries(opts.pathParams)) {
      resolved = resolved.replace(
        `{${key}}`,
        encodeURIComponent(String(value)),
      );
    }
  }

  // El OpenAPI declara `servers: [{ url: "{apiBase}/v1" }]`, así que los
  // paths del schema (`/leads`, `/auth/me`) son relativos al server. El
  // cliente prefija `/v1` siempre.
  const url = new URL(`/v1${resolved.startsWith("/") ? resolved : `/${resolved}`}`, base);

  if (opts.query) {
    for (const [key, value] of Object.entries(opts.query)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function buildHeaders(
  method: HttpMethod,
  opts: ApiRequestOptions,
): Promise<Headers> {
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Correlation-Id": crypto.randomUUID(),
  });

  if (opts.getToken) {
    const token = await opts.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  if (opts.tenantId) {
    headers.set("X-Tenant-Id", opts.tenantId);
  }

  if (method !== "GET" && opts.idempotencyKey) {
    const key =
      opts.idempotencyKey === "auto" ? crypto.randomUUID() : opts.idempotencyKey;
    headers.set("Idempotency-Key", key);
  }

  if (opts.headers) {
    for (const [k, v] of Object.entries(opts.headers)) {
      // No sobrescribimos los headers críticos (auth, tenant, correlation).
      if (!headers.has(k)) headers.set(k, v);
    }
  }

  return headers;
}

async function request<TResponse>(
  method: HttpMethod,
  path: string,
  body: unknown,
  opts: ApiRequestOptions = {},
): Promise<TResponse> {
  const url = buildUrl(path, opts);
  const headers = await buildHeaders(method, opts);

  const init: RequestInit = {
    method,
    headers,
    signal: opts.signal,
  };
  if (body !== undefined && method !== "GET") {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);

  if (!response.ok) {
    throw await apiErrorFromResponse(response);
  }

  // 204 No Content u otros bodyless: devolvemos `undefined` cast al tipo.
  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

export function apiGet<TResponse>(
  path: string,
  opts: ApiRequestOptions = {},
): Promise<TResponse> {
  return request<TResponse>("GET", path, undefined, opts);
}

export function apiPost<TResponse>(
  path: string,
  body: unknown,
  opts: ApiRequestOptions = {},
): Promise<TResponse> {
  return request<TResponse>("POST", path, body, opts);
}

export function apiPatch<TResponse>(
  path: string,
  body: unknown,
  opts: ApiRequestOptions = {},
): Promise<TResponse> {
  return request<TResponse>("PATCH", path, body, opts);
}

export function apiPut<TResponse>(
  path: string,
  body: unknown,
  opts: ApiRequestOptions = {},
): Promise<TResponse> {
  return request<TResponse>("PUT", path, body, opts);
}

export function apiDelete<TResponse = void>(
  path: string,
  opts: ApiRequestOptions = {},
): Promise<TResponse> {
  return request<TResponse>("DELETE", path, undefined, opts);
}
