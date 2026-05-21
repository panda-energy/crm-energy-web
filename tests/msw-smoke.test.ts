import { describe, expect, it } from "vitest";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

describe("MSW smoke — Sprint 2", () => {
  it("intercepta GET /v1/leads y devuelve un Page<LeadOut> con 15 fixtures", async () => {
    const response = await fetch(`${API_URL}/v1/leads?limit=50&offset=0`);
    expect(response.status).toBe(200);
    expect(response.headers.get("x-correlation-id")).toBeTruthy();

    const body = (await response.json()) as {
      items: Array<{
        id: string;
        first_name: string | null;
        last_name: string | null;
        status: string;
        pipeline_id: string;
        stage_id: string;
        tags: string[];
      }>;
      total: number;
      limit: number;
      offset: number;
    };
    expect(body.total).toBe(15);
    expect(body.items).toHaveLength(15);
    expect(body.limit).toBe(50);
    expect(body.offset).toBe(0);
    // Default sort = created_at desc → el más reciente primero (Sergi,
    // 2026-05-10).
    expect(body.items[0]?.first_name).toBe("Sergi");
    expect(body.items[0]?.last_name).toBe("Roca Mas");
    // María está en la lista, en otra posición.
    const maria = body.items.find((l) => l.first_name === "María");
    expect(maria?.last_name).toBe("García López");
    expect(maria?.tags).toContain("pyme");
    expect(maria?.pipeline_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(maria?.stage_id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("filtra GET /v1/leads por statuses[] y q", async () => {
    const response = await fetch(
      `${API_URL}/v1/leads?statuses=won&statuses=qualified&q=ortega`,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      items: Array<{ first_name: string | null; status: string }>;
      total: number;
    };
    expect(body.total).toBe(1);
    expect(body.items[0]?.first_name).toBe("Beatriz");
    expect(body.items[0]?.status).toBe("qualified");
  });

  it("intercepta GET /v1/pipelines y devuelve la default con 5 stages", async () => {
    const response = await fetch(`${API_URL}/v1/pipelines`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as Array<{
      id: string;
      name: string;
      slug: string;
      is_default: boolean;
      stages: Array<{ slug: string; position: number; is_won: boolean; is_lost: boolean }>;
    }>;
    expect(body.length).toBeGreaterThanOrEqual(1);
    const def = body.find((p) => p.is_default);
    expect(def).toBeDefined();
    expect(def?.name).toBe("Default");
    expect(def?.stages).toHaveLength(5);
    expect(def?.stages.map((s) => s.slug)).toEqual([
      "new",
      "contacted",
      "qualified",
      "won",
      "lost",
    ]);
    expect(def?.stages.find((s) => s.slug === "won")?.is_won).toBe(true);
    expect(def?.stages.find((s) => s.slug === "lost")?.is_lost).toBe(true);
  });

  it("intercepta GET /v1/leads/{id} y devuelve 404 Problem cuando no existe", async () => {
    const response = await fetch(
      `${API_URL}/v1/leads/00000000-0000-0000-0000-000000000000`,
    );
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain(
      "application/problem+json",
    );
    const body = (await response.json()) as {
      status: number;
      title: string;
      correlationId: string;
    };
    expect(body.status).toBe(404);
    expect(body.title).toBe("Lead no encontrado");
    expect(body.correlationId).toBeTruthy();
  });
});
