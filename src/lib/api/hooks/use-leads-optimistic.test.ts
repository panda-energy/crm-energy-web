import { describe, expect, it } from "vitest";
import type { Lead, LeadUpdate } from "./use-leads";
import { __TESTONLY__ } from "./use-leads-optimistic";

const { applyPatch, buildInversePatch } = __TESTONLY__;

const baseLead: Lead = {
  id: "00000000-0000-0000-0000-000000000001",
  tenant_id: "11111111-1111-1111-1111-111111111111",
  pipeline_id: "33333333-3333-3333-3333-333333333333",
  stage_id: "44444444-4444-4444-4444-440000000001",
  owner_id: null,
  first_name: "María",
  last_name: "García",
  email: "maria@ejemplo.com",
  phone_e164: "+34612345678",
  company: "ACME",
  cups: null,
  status: "new",
  source: "manual",
  source_ref: null,
  tags: ["pyme"],
  custom_fields: {},
  estimated_value_cents: 100000,
  currency: "EUR",
  last_contacted_at: null,
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
};

describe("applyPatch", () => {
  it("aplica solo los campos presentes", () => {
    const patch: LeadUpdate = { first_name: "Marta" };
    const result = applyPatch(baseLead, patch);
    expect(result).toEqual({ first_name: "Marta" });
  });

  it("traduce phone → phone_e164 en el optimistic", () => {
    const patch: LeadUpdate = { phone: "+34699999999" };
    const result = applyPatch(baseLead, patch);
    expect(result).toEqual({ phone_e164: "+34699999999" });
  });

  it("acepta tags como reemplazo completo", () => {
    const result = applyPatch(baseLead, { tags: ["nueva", "lista"] });
    expect(result.tags).toEqual(["nueva", "lista"]);
  });

  it("convierte null en patch para nulificar campo", () => {
    const result = applyPatch(baseLead, { email: null });
    expect(result.email).toBeNull();
  });
});

describe("buildInversePatch", () => {
  it("devuelve el valor previo de los campos modificados", () => {
    const inverse = buildInversePatch(baseLead, { first_name: "Marta" });
    expect(inverse).toEqual({ first_name: "María" });
  });

  it("revierte tags al array original", () => {
    const inverse = buildInversePatch(baseLead, {
      tags: ["nueva"],
    });
    expect(inverse).toEqual({ tags: ["pyme"] });
  });

  it("revierte phone usando phone_e164 anterior", () => {
    const inverse = buildInversePatch(baseLead, {
      phone: "+34699999999",
    });
    expect(inverse).toEqual({ phone: "+34612345678" });
  });

  it("revierte estimated_value_cents", () => {
    const inverse = buildInversePatch(baseLead, {
      estimated_value_cents: 999999,
    });
    expect(inverse).toEqual({ estimated_value_cents: 100000 });
  });

  it("devuelve null si el patch está vacío o no contiene campos reversibles", () => {
    expect(buildInversePatch(baseLead, {})).toBeNull();
  });

  it("preserva null como reset cuando el campo previo era null", () => {
    // Establecemos owner_id en el patch; el valor previo era null → revertir
    // a null.
    const inverse = buildInversePatch(baseLead, {
      owner_id: "22222222-2222-2222-2222-222222222222",
    });
    expect(inverse).toEqual({ owner_id: null });
  });
});
