import { describe, expect, it } from "vitest";
import {
  applyOptimisticMoveToPage,
  computeDropPosition,
  groupLeadsByStage,
  makeStageDroppableId,
  parseDropEvent,
  parseStageDroppableId,
} from "./dnd-helpers";
import type { Lead, LeadPage } from "@/lib/api/hooks/use-leads";

function makeLead(overrides: Partial<Lead>): Lead {
  return {
    id: "lead-1",
    tenant_id: "t-1",
    pipeline_id: "p-1",
    stage_id: "stage-new",
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
    created_at: "2026-05-01T00:00:00.000Z",
    updated_at: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("makeStageDroppableId / parseStageDroppableId", () => {
  it("round-trip de un stage id", () => {
    const id = "44444444-4444-4444-4444-440000000001";
    expect(parseStageDroppableId(makeStageDroppableId(id))).toBe(id);
  });

  it("devuelve null si el id no tiene prefijo de stage", () => {
    expect(parseStageDroppableId("0a1b1c11-…")).toBeNull();
  });
});

describe("parseDropEvent", () => {
  const leadStageById = new Map<string, string>([
    ["lead-a", "stage-new"],
    ["lead-b", "stage-contacted"],
    ["lead-c", "stage-qualified"],
  ]);

  it("drop sobre una columna distinta → transición válida sin overCardId", () => {
    const result = parseDropEvent({
      activeId: "lead-a",
      overId: makeStageDroppableId("stage-contacted"),
      leadStageById,
    });
    expect(result).toEqual({
      leadId: "lead-a",
      fromStageId: "stage-new",
      toStageId: "stage-contacted",
      overCardId: null,
    });
  });

  it("drop sobre otra card → resuelve stage y propaga overCardId", () => {
    const result = parseDropEvent({
      activeId: "lead-a",
      overId: "lead-c",
      leadStageById,
    });
    expect(result).toEqual({
      leadId: "lead-a",
      fromStageId: "stage-new",
      toStageId: "stage-qualified",
      overCardId: "lead-c",
    });
  });

  it("drop sobre la misma columna → null (no-op)", () => {
    const result = parseDropEvent({
      activeId: "lead-a",
      overId: makeStageDroppableId("stage-new"),
      leadStageById,
    });
    expect(result).toBeNull();
  });

  it("drop sobre otra card del mismo stage → null", () => {
    const map = new Map(leadStageById);
    map.set("lead-d", "stage-new");
    const result = parseDropEvent({
      activeId: "lead-a",
      overId: "lead-d",
      leadStageById: map,
    });
    expect(result).toBeNull();
  });

  it("active no está en el mapa → null", () => {
    const result = parseDropEvent({
      activeId: "lead-x",
      overId: makeStageDroppableId("stage-contacted"),
      leadStageById,
    });
    expect(result).toBeNull();
  });

  it("over no resuelve a stage → null", () => {
    const result = parseDropEvent({
      activeId: "lead-a",
      overId: "lead-zzz-unknown",
      leadStageById,
    });
    expect(result).toBeNull();
  });
});

describe("applyOptimisticMoveToPage", () => {
  const basePage: LeadPage = {
    items: [
      makeLead({ id: "lead-a", stage_id: "stage-new", status: "new" }),
      makeLead({ id: "lead-b", stage_id: "stage-contacted", status: "contacted" }),
    ],
    total: 2,
    limit: 50,
    offset: 0,
  };

  it("actualiza stage y mantiene total", () => {
    const next = applyOptimisticMoveToPage(
      basePage,
      "lead-a",
      "stage-qualified",
      "qualified",
    );
    expect(next.items[0]!.stage_id).toBe("stage-qualified");
    expect(next.items[0]!.status).toBe("qualified");
    expect(next.total).toBe(2);
    // Inmutabilidad: el original no se mutó.
    expect(basePage.items[0]!.stage_id).toBe("stage-new");
  });

  it("si el lead no está en la página devuelve el mismo objeto", () => {
    const next = applyOptimisticMoveToPage(
      basePage,
      "lead-zzz",
      "stage-qualified",
    );
    expect(next).toBe(basePage);
  });

  it("sin nextStatus conserva el status anterior", () => {
    const next = applyOptimisticMoveToPage(
      basePage,
      "lead-a",
      "stage-qualified",
    );
    expect(next.items[0]!.status).toBe("new");
  });
});

describe("computeDropPosition", () => {
  const stageCards = [
    { id: "a" },
    { id: "b" },
    { id: "c" },
    { id: "d" },
  ];

  it("drop al final → null", () => {
    expect(computeDropPosition(stageCards, null)).toBeNull();
  });

  it("drop sobre la primera card → 0 (al principio)", () => {
    expect(computeDropPosition(stageCards, "a")).toBe(0);
  });

  it("drop entre cards → índice de la card destino", () => {
    expect(computeDropPosition(stageCards, "c")).toBe(2);
  });

  it("drop sobre la última card → len - 1", () => {
    expect(computeDropPosition(stageCards, "d")).toBe(3);
  });

  it("columna vacía → null", () => {
    expect(computeDropPosition([], "anything")).toBeNull();
  });

  it("overCardId no encontrado → null (degrada a 'al final')", () => {
    expect(computeDropPosition(stageCards, "zzz")).toBeNull();
  });
});

describe("groupLeadsByStage", () => {
  it("agrupa preservando el orden", () => {
    const leads = [
      makeLead({ id: "a", stage_id: "s1" }),
      makeLead({ id: "b", stage_id: "s2" }),
      makeLead({ id: "c", stage_id: "s1" }),
    ];
    const result = groupLeadsByStage(leads);
    expect(result.get("s1")?.map((l) => l.id)).toEqual(["a", "c"]);
    expect(result.get("s2")?.map((l) => l.id)).toEqual(["b"]);
  });

  it("array vacío → map vacío", () => {
    expect(groupLeadsByStage([]).size).toBe(0);
  });
});
