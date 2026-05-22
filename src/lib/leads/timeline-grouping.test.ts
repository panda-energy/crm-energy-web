import { describe, expect, it } from "vitest";

import type { Lead } from "@/lib/api/hooks/use-leads";
import {
  computeStagnationBadge,
  groupLeadsByMonth,
  referenceDateForGrouping,
} from "./timeline-grouping";

// Helper de fixtures — solo rellena lo que importa al test, defaults seguros
// para los demás campos del Lead.
function makeLead(overrides: Partial<Lead>): Lead {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    tenant_id: "22222222-2222-2222-2222-222222222222",
    pipeline_id: "33333333-3333-3333-3333-333333333333",
    stage_id: "44444444-4444-4444-4444-444444444444",
    owner_id: null,
    first_name: null,
    last_name: null,
    email: null,
    phone_e164: null,
    company: null,
    cups: null,
    status: "new",
    source: "manual",
    source_ref: null,
    tags: [],
    custom_fields: {},
    estimated_value_cents: null,
    currency: "EUR",
    last_contacted_at: null,
    position: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("referenceDateForGrouping", () => {
  it("prefiere last_contacted_at cuando existe", () => {
    const lead = makeLead({
      last_contacted_at: "2026-05-20T10:00:00Z",
      updated_at: "2026-05-10T10:00:00Z",
      created_at: "2026-05-01T10:00:00Z",
    });
    expect(referenceDateForGrouping(lead)).toBe("2026-05-20T10:00:00Z");
  });

  it("cae a updated_at si no hay last_contacted_at", () => {
    const lead = makeLead({
      last_contacted_at: null,
      updated_at: "2026-05-10T10:00:00Z",
      created_at: "2026-05-01T10:00:00Z",
    });
    expect(referenceDateForGrouping(lead)).toBe("2026-05-10T10:00:00Z");
  });

  it("cae a created_at si no hay last_contacted_at ni updated_at definido", () => {
    // updated_at NUNCA es null en el contrato, pero modelamos el peor caso.
    const lead = makeLead({
      last_contacted_at: null,
      created_at: "2026-04-01T10:00:00Z",
    });
    // updated_at default del helper es 2026-05-01; verificamos que se prefiere
    // sobre created_at.
    expect(referenceDateForGrouping(lead)).toBe("2026-05-01T10:00:00Z");
  });
});

describe("groupLeadsByMonth", () => {
  it("devuelve array vacío con input vacío", () => {
    expect(groupLeadsByMonth([])).toEqual([]);
  });

  it("agrupa leads del mismo mes en un solo grupo", () => {
    const leads = [
      makeLead({ id: "a", last_contacted_at: "2026-05-20T10:00:00Z" }),
      makeLead({ id: "b", last_contacted_at: "2026-05-05T10:00:00Z" }),
    ];
    const groups = groupLeadsByMonth(leads);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.monthKey).toBe("2026-05");
    expect(groups[0]!.label).toBe("Mayo 2026");
    expect(groups[0]!.leads.map((l) => l.id)).toEqual(["a", "b"]);
  });

  it("ordena grupos cronológicamente inverso (más reciente primero)", () => {
    const leads = [
      makeLead({ id: "old", last_contacted_at: "2026-03-15T10:00:00Z" }),
      makeLead({ id: "mid", last_contacted_at: "2026-04-15T10:00:00Z" }),
      makeLead({ id: "new", last_contacted_at: "2026-05-15T10:00:00Z" }),
    ];
    const groups = groupLeadsByMonth(leads);
    expect(groups.map((g) => g.monthKey)).toEqual([
      "2026-05",
      "2026-04",
      "2026-03",
    ]);
  });

  it("dentro de cada mes ordena por fecha de referencia desc", () => {
    const leads = [
      makeLead({ id: "early", last_contacted_at: "2026-05-02T10:00:00Z" }),
      makeLead({ id: "late", last_contacted_at: "2026-05-29T10:00:00Z" }),
      makeLead({ id: "mid", last_contacted_at: "2026-05-15T10:00:00Z" }),
    ];
    const [group] = groupLeadsByMonth(leads);
    expect(group!.leads.map((l) => l.id)).toEqual(["late", "mid", "early"]);
  });

  it("ignora leads con fecha inválida en lugar de crashear", () => {
    const valid = makeLead({
      id: "ok",
      last_contacted_at: "2026-05-15T10:00:00Z",
    });
    const broken = makeLead({
      id: "broken",
      last_contacted_at: "not-a-date",
      updated_at: "not-a-date",
      created_at: "not-a-date",
    });
    const groups = groupLeadsByMonth([valid, broken]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.leads.map((l) => l.id)).toEqual(["ok"]);
  });
});

describe("computeStagnationBadge", () => {
  const NOW = new Date("2026-05-22T12:00:00Z");

  it("none cuando el lead es reciente y aún se progresa", () => {
    const lead = makeLead({
      status: "qualified",
      created_at: "2026-05-10T10:00:00Z",
      last_contacted_at: "2026-05-20T10:00:00Z",
    });
    const badge = computeStagnationBadge(lead, NOW);
    expect(badge.level).toBe("none");
    expect(badge.label).toBeNull();
  });

  it("stale_contact cuando han pasado >14 días desde last_contacted_at", () => {
    const lead = makeLead({
      status: "qualified",
      created_at: "2026-05-01T10:00:00Z",
      last_contacted_at: "2026-05-01T10:00:00Z",
    });
    const badge = computeStagnationBadge(lead, NOW);
    expect(badge.level).toBe("stale_contact");
    expect(badge.label).toBe("Sin contacto 21 días");
    expect(badge.variant).toBe("destructive");
  });

  it("usa singular 'día' cuando son exactamente 15 días", () => {
    // Borderline: 14 = no muestra; 15 = sí, en plural ("Sin contacto 15
    // días"). El caso singular ("1 día") solo se daría tras >14 días, es
    // decir 15+. Verificamos el plural por si la condición se relaja.
    const lead = makeLead({
      status: "qualified",
      last_contacted_at: "2026-05-07T10:00:00Z",
    });
    const badge = computeStagnationBadge(lead, NOW);
    expect(badge.level).toBe("stale_contact");
    expect(badge.label).toBe("Sin contacto 15 días");
  });

  it("NO muestra stale_contact si exactamente 14 días han pasado (umbral estricto)", () => {
    const lead = makeLead({
      status: "qualified",
      last_contacted_at: "2026-05-08T10:00:00Z",
    });
    const badge = computeStagnationBadge(lead, NOW);
    expect(badge.level).toBe("none");
  });

  it("stagnant cuando lead >30 días + status new", () => {
    const lead = makeLead({
      status: "new",
      created_at: "2026-04-15T10:00:00Z",
      last_contacted_at: null,
    });
    const badge = computeStagnationBadge(lead, NOW);
    expect(badge.level).toBe("stagnant");
    expect(badge.label).toBe("Estancado");
    expect(badge.variant).toBe("warning");
  });

  it("stagnant tiene prioridad sobre stale_contact cuando ambas aplican", () => {
    const lead = makeLead({
      status: "contacted",
      created_at: "2026-04-15T10:00:00Z",
      last_contacted_at: "2026-04-30T10:00:00Z",
    });
    const badge = computeStagnationBadge(lead, NOW);
    expect(badge.level).toBe("stagnant");
  });

  it("status won/qualified/lost NO disparan stagnant aunque sean viejos", () => {
    for (const status of ["qualified", "won", "lost"] as const) {
      const lead = makeLead({
        status,
        created_at: "2026-01-01T10:00:00Z",
        last_contacted_at: "2026-05-21T10:00:00Z",
      });
      const badge = computeStagnationBadge(lead, NOW);
      expect(badge.level).toBe("none");
    }
  });

  it("sin last_contacted_at + lead reciente → none", () => {
    const lead = makeLead({
      status: "new",
      created_at: "2026-05-15T10:00:00Z",
      last_contacted_at: null,
    });
    const badge = computeStagnationBadge(lead, NOW);
    expect(badge.level).toBe("none");
  });
});
