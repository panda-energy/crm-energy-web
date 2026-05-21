import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import {
  apiGet,
  apiPost,
  type GetTokenFn,
} from "@/lib/api/client";
import { ApiError, isApiError } from "@/lib/api/error";
import { QueryClient } from "@tanstack/react-query";
import { server } from "@/mocks/server";

/**
 * Tests del wrapper API:
 *  - Inyecta `Authorization`, `X-Tenant-Id`, `X-Correlation-Id`, `Content-Type`.
 *  - Inyecta `Idempotency-Key` solo cuando se pide y solo en no-GET.
 *  - Convierte respuestas Problem RFC 7807 a `ApiError`.
 *  - Retry policy: rechaza 4xx, acepta 5xx con failureCount < 2.
 *
 * Estos tests reutilizan el `server` global de MSW (montado por
 * `tests/setup.ts`) y registran handlers ad-hoc por test con `server.use()`.
 * Eso garantiza que solo un servidor está escuchando — escuchar dos provoca
 * que cada request capture dos veces.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

describe("apiGet — headers inyectados", () => {
  it("inyecta Authorization, X-Tenant-Id, X-Correlation-Id, Accept, Content-Type", async () => {
    const captured: Headers[] = [];
    server.use(
      http.get(`${API_URL}/v1/leads`, ({ request }) => {
        captured.push(request.headers);
        return HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 25 });
      }),
    );

    const getToken: GetTokenFn = async () => "jwt-token-abc";

    await apiGet("/leads", {
      getToken,
      tenantId: "tenant-xyz",
    });

    expect(captured).toHaveLength(1);
    const headers = captured[0];
    if (!headers) throw new Error("no headers captured");
    expect(headers.get("Authorization")).toBe("Bearer jwt-token-abc");
    expect(headers.get("X-Tenant-Id")).toBe("tenant-xyz");
    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("X-Correlation-Id")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("omite Authorization cuando getToken devuelve null", async () => {
    const captured: Headers[] = [];
    server.use(
      http.get(`${API_URL}/v1/leads`, ({ request }) => {
        captured.push(request.headers);
        return HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 25 });
      }),
    );

    await apiGet("/leads", {
      getToken: async () => null,
    });

    const headers = captured[0];
    if (!headers) throw new Error("no headers captured");
    expect(headers.get("Authorization")).toBeNull();
  });

  it("genera Idempotency-Key automáticamente cuando idempotencyKey='auto'", async () => {
    const captured: Headers[] = [];
    server.use(
      http.post(`${API_URL}/v1/leads`, async ({ request }) => {
        captured.push(request.headers);
        return HttpResponse.json({ id: "x" }, { status: 201 });
      }),
    );

    await apiPost("/leads", { name: "A" }, { idempotencyKey: "auto" });

    const key = captured[0]?.get("Idempotency-Key");
    expect(key).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("NO inyecta Idempotency-Key en GET aunque se pase", async () => {
    const captured: Headers[] = [];
    server.use(
      http.get(`${API_URL}/v1/leads`, ({ request }) => {
        captured.push(request.headers);
        return HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 25 });
      }),
    );

    // reason: el cliente debería ignorar idempotencyKey en GET para no
    // ensuciar las claves del backend con valores que ese método no honra.
    await apiGet("/leads", { idempotencyKey: "auto" });

    const headers = captured[0];
    if (!headers) throw new Error("no headers captured");
    expect(headers.get("Idempotency-Key")).toBeNull();
  });

  it("propaga query params al URL", async () => {
    const urls: string[] = [];
    server.use(
      http.get(`${API_URL}/v1/leads`, ({ request }) => {
        urls.push(request.url);
        return HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 25 });
      }),
    );

    await apiGet("/leads", { query: { page: 2, status: "new" } });

    expect(urls[0]).toContain("page=2");
    expect(urls[0]).toContain("status=new");
  });

  it("sustituye path params en la ruta", async () => {
    const urls: string[] = [];
    server.use(
      http.get(`${API_URL}/v1/leads/abc-123`, ({ request }) => {
        urls.push(request.url);
        return HttpResponse.json({ id: "abc-123" });
      }),
    );

    await apiGet("/leads/{leadId}", { pathParams: { leadId: "abc-123" } });

    expect(urls[0]).toContain("/v1/leads/abc-123");
  });
});

describe("ApiError — parsing de Problem RFC 7807", () => {
  it("parsea Problem JSON con correlationId del cuerpo", async () => {
    server.use(
      http.get(`${API_URL}/v1/leads/missing`, () =>
        HttpResponse.json(
          {
            type: "https://errors.panda.energy/leads/not-found",
            title: "Lead no encontrado",
            status: 404,
            detail: "No existe lead con id missing",
            correlationId: "cor-from-body",
          },
          {
            status: 404,
            headers: {
              "content-type": "application/problem+json",
              "x-correlation-id": "cor-from-header",
            },
          },
        ),
      ),
    );

    await expect(apiGet("/leads/{leadId}", { pathParams: { leadId: "missing" } }))
      .rejects.toMatchObject({
        name: "ApiError",
        type: "https://errors.panda.energy/leads/not-found",
        title: "Lead no encontrado",
        status: 404,
        detail: "No existe lead con id missing",
        // Cuerpo gana sobre header cuando ambos existen.
        correlationId: "cor-from-body",
      });
  });

  it("fallback cuando el cuerpo no es Problem JSON", async () => {
    server.use(
      http.get(
        `${API_URL}/v1/leads`,
        () =>
          new HttpResponse("Internal Server Error", {
            status: 500,
            headers: {
              "content-type": "text/plain",
              "x-correlation-id": "cor-xyz",
            },
          }),
      ),
    );

    try {
      await apiGet("/leads");
      throw new Error("should have thrown");
    } catch (err) {
      expect(isApiError(err)).toBe(true);
      if (isApiError(err)) {
        expect(err.status).toBe(500);
        expect(err.type).toBe("about:blank");
        expect(err.correlationId).toBe("cor-xyz");
      }
    }
  });

  it("isApiError() distingue de Error genérico", () => {
    const apiErr = new ApiError({ type: "x", title: "y", status: 400 });
    const genericErr = new Error("nope");

    expect(isApiError(apiErr)).toBe(true);
    expect(isApiError(genericErr)).toBe(false);
    expect(isApiError(null)).toBe(false);
    expect(isApiError("string")).toBe(false);
  });
});

describe("Retry policy del QueryClient", () => {
  // Importamos la misma lógica que vive en `query-client.tsx`. Para no acoplar,
  // recreamos un client con la misma policy y verificamos el comportamiento.
  function makeClient() {
    return new QueryClient({
      defaultOptions: {
        queries: {
          retry: (failureCount, error) => {
            if (isApiError(error)) {
              if (error.status < 500) return false;
              return failureCount < 2;
            }
            return failureCount < 1;
          },
          retryDelay: 0,
        },
      },
    });
  }

  it("NO reintenta en 4xx", async () => {
    const fn = vi.fn(async () => {
      throw new ApiError({ type: "x", title: "Bad Request", status: 400 });
    });
    const client = makeClient();

    await expect(
      client.fetchQuery({ queryKey: ["t1"], queryFn: fn }),
    ).rejects.toBeInstanceOf(ApiError);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("reintenta en 5xx hasta failureCount=2 (3 calls totales)", async () => {
    const fn = vi.fn(async () => {
      throw new ApiError({ type: "x", title: "Boom", status: 500 });
    });
    const client = makeClient();

    await expect(
      client.fetchQuery({ queryKey: ["t2"], queryFn: fn }),
    ).rejects.toBeInstanceOf(ApiError);

    // 1 inicial + 2 retries = 3.
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
