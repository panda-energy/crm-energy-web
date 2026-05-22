import { describe, expect, it } from "vitest";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

describe("MSW smoke — Sprint 2", () => {
  it("intercepta GET /v1/leads y devuelve un Page<LeadOut> con los 50 fixtures", async () => {
    const response = await fetch(`${API_URL}/v1/leads?limit=200&offset=0`);
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
    expect(body.total).toBe(50);
    expect(body.items).toHaveLength(50);
    expect(body.limit).toBe(200);
    expect(body.offset).toBe(0);
    // Default sort = created_at desc → el más reciente primero
    // (María García López, 2026-05-22).
    expect(body.items[0]?.first_name).toBe("María");
    expect(body.items[0]?.last_name).toBe("García López");
    expect(body.items[0]?.tags).toContain("pyme");
    expect(body.items[0]?.pipeline_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.items[0]?.stage_id).toMatch(/^[0-9a-f-]{36}$/);

    // Los 50 leads distribuidos entre 2 pipelines (Default + Empresas).
    const pipelines = new Set(body.items.map((l) => l.pipeline_id));
    expect(pipelines.size).toBe(2);
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

  it("acepta POST /v1/leads/bulk con las 4 acciones combinadas y devuelve matched/updated/ids", async () => {
    // Cogemos 2 IDs reales del fixture para evitar acoplar el test a UUIDs
    // mágicos: leemos la lista, escogemos los 2 primeros.
    const list = (await (await fetch(`${API_URL}/v1/leads?limit=5`)).json()) as {
      items: Array<{ id: string; status: string; tags: string[] }>;
    };
    const ids = list.items.slice(0, 2).map((l) => l.id);

    // assign_owner + set_status + add_tags + remove_tags en una sola call.
    const response = await fetch(`${API_URL}/v1/leads/bulk`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        ids,
        assign_owner_id: "99999999-9999-9999-9999-999999999999",
        set_status: "contacted",
        add_tags: ["wave2-bulk"],
        remove_tags: ["pyme"],
      }),
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      matched: number;
      updated: number;
      ids: string[];
    };
    expect(body.matched).toBe(2);
    expect(body.updated).toBe(2);
    expect(body.ids.sort()).toEqual([...ids].sort());

    // Verifica que el cambio quedó aplicado (status + tag añadido).
    const after = (await (await fetch(`${API_URL}/v1/leads/${ids[0]}`)).json()) as {
      status: string;
      tags: string[];
      owner_id: string | null;
    };
    expect(after.status).toBe("contacted");
    expect(after.tags).toContain("wave2-bulk");
    expect(after.owner_id).toBe("99999999-9999-9999-9999-999999999999");
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
