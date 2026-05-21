import { describe, expect, it } from "vitest";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

describe("MSW smoke", () => {
  it("intercepta GET /v1/leads y devuelve el fixture paginado", async () => {
    const response = await fetch(`${API_URL}/v1/leads?page=1&pageSize=25`);
    expect(response.status).toBe(200);
    expect(response.headers.get("x-correlation-id")).toBeTruthy();

    const body = (await response.json()) as {
      items: Array<{ id: string; name: string }>;
      total: number;
      page: number;
      pageSize: number;
    };
    expect(body.total).toBe(15);
    expect(body.items).toHaveLength(15);
    expect(body.items[0]?.name).toBe("María García López");
  });

  it("intercepta GET /v1/auth/me", async () => {
    const response = await fetch(`${API_URL}/v1/auth/me`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { email: string; role: string };
    expect(body.email).toBe("comercial@panda.energy");
    expect(body.role).toBe("sales");
  });
});
