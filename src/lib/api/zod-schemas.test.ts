import { describe, expect, it } from "vitest";
import {
  ActivitySchema,
  LeadCreateSchema,
  LeadUpdateSchema,
  PHONE_E164_PATTERN,
  phoneE164Schema,
} from "./zod-schemas";

/**
 * Tests del boundary layer Zod tras el cleanup wave:
 *  - `phoneE164Schema` cumple E.164 estricto.
 *  - `LeadCreate.phone` rechaza `''` (CREATE no permite reset).
 *  - `LeadUpdate.phone` acepta `''` y `null` como reset explícito.
 *  - `ActivitySchema` narrowing exhaustivo por discriminador `type`.
 */

describe("phoneE164Schema", () => {
  it("acepta +34612345678", () => {
    expect(phoneE164Schema.safeParse("+34612345678").success).toBe(true);
  });

  it("acepta +1234567 (mínimo válido)", () => {
    expect(phoneE164Schema.safeParse("+1234567").success).toBe(true);
  });

  it("rechaza 612345678 (sin +)", () => {
    expect(phoneE164Schema.safeParse("612345678").success).toBe(false);
  });

  it("rechaza +0123 (primer dígito 0 prohibido)", () => {
    expect(phoneE164Schema.safeParse("+0123").success).toBe(false);
  });

  it("rechaza la cadena vacía", () => {
    expect(phoneE164Schema.safeParse("").success).toBe(false);
  });

  it("rechaza un teléfono con espacios", () => {
    expect(phoneE164Schema.safeParse("+34 612 345 678").success).toBe(false);
  });

  it("rechaza más de 15 dígitos", () => {
    expect(phoneE164Schema.safeParse("+1234567890123456").success).toBe(false);
  });

  it("pattern público está expuesto y coincide con el schema", () => {
    expect(PHONE_E164_PATTERN.test("+34612345678")).toBe(true);
    expect(PHONE_E164_PATTERN.test("612345678")).toBe(false);
  });
});

describe("LeadCreateSchema.phone", () => {
  it("acepta phone E.164 válido", () => {
    const r = LeadCreateSchema.safeParse({
      first_name: "Marta",
      phone: "+34612345678",
    });
    expect(r.success).toBe(true);
  });

  it("acepta phone omitido (campo opcional)", () => {
    const r = LeadCreateSchema.safeParse({ first_name: "Marta" });
    expect(r.success).toBe(true);
  });

  it("acepta phone null (omitir explícito)", () => {
    const r = LeadCreateSchema.safeParse({
      first_name: "Marta",
      phone: null,
    });
    expect(r.success).toBe(true);
  });

  it("rechaza phone vacío '' en CREATE", () => {
    const r = LeadCreateSchema.safeParse({
      first_name: "Marta",
      phone: "",
    });
    expect(r.success).toBe(false);
  });

  it("rechaza phone con formato no E.164", () => {
    const r = LeadCreateSchema.safeParse({
      first_name: "Marta",
      phone: "612345678",
    });
    expect(r.success).toBe(false);
  });
});

describe("LeadUpdateSchema.phone", () => {
  it("acepta phone E.164 válido (sustitución)", () => {
    const r = LeadUpdateSchema.safeParse({ phone: "+34699999999" });
    expect(r.success).toBe(true);
  });

  it("acepta phone '' como reset → null (cleanup wave)", () => {
    const r = LeadUpdateSchema.safeParse({ phone: "" });
    expect(r.success).toBe(true);
  });

  it("acepta phone null como reset explícito", () => {
    const r = LeadUpdateSchema.safeParse({ phone: null });
    expect(r.success).toBe(true);
  });

  it("acepta phone omitido (campo opcional)", () => {
    const r = LeadUpdateSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it("rechaza phone con formato no E.164", () => {
    const r = LeadUpdateSchema.safeParse({ phone: "612345678" });
    expect(r.success).toBe(false);
  });
});

describe("ActivitySchema (discriminated union)", () => {
  // UUID v4 válidos (4xxx en 3er segmento, [89ab]xxx en 4to segmento).
  const UUID_A = "12345678-1234-4abc-89ab-1234567890ab";
  const UUID_B = "23456789-2345-4def-8abc-2345678901bc";
  const UUID_FROM = "34567890-3456-4012-9abc-3456789012cd";
  const UUID_TO = "45678901-4567-4123-aabc-4567890123de";

  const base = {
    id: UUID_A,
    lead_id: UUID_B,
    actor_user_id: null,
    summary: null,
    occurred_at: "2026-05-22T10:00:00Z",
    created_at: "2026-05-22T10:00:00Z",
  };

  it("parsea note con payload.body opcional", () => {
    const r = ActivitySchema.safeParse({
      ...base,
      type: "note",
      payload: { body: "Hola mundo" },
    });
    expect(r.success).toBe(true);
    if (r.success && r.data.type === "note") {
      // narrowing exhaustivo: TS sabe que payload.body existe.
      expect(r.data.payload.body).toBe("Hola mundo");
    }
  });

  it("parsea stage_changed con to_stage_id requerido", () => {
    const r = ActivitySchema.safeParse({
      ...base,
      type: "stage_changed",
      payload: {
        from_stage_id: UUID_FROM,
        to_stage_id: UUID_TO,
      },
    });
    expect(r.success).toBe(true);
  });

  it("rechaza stage_changed sin to_stage_id", () => {
    const r = ActivitySchema.safeParse({
      ...base,
      type: "stage_changed",
      payload: { from_stage_id: UUID_FROM },
    });
    expect(r.success).toBe(false);
  });

  it("parsea status_changed con to_status requerido", () => {
    const r = ActivitySchema.safeParse({
      ...base,
      type: "status_changed",
      payload: { from_status: "new", to_status: "contacted" },
    });
    expect(r.success).toBe(true);
  });

  it("parsea bulk_action con payload.action", () => {
    const r = ActivitySchema.safeParse({
      ...base,
      type: "bulk_action",
      payload: { action: "delete", params: { ids_count: 5 } },
    });
    expect(r.success).toBe(true);
  });

  it("parsea restored con restored_from opcional", () => {
    const r = ActivitySchema.safeParse({
      ...base,
      type: "restored",
      payload: { restored_from: "2026-05-22T09:00:00Z" },
    });
    expect(r.success).toBe(true);
  });

  it("parsea unknown como fallback opaco", () => {
    const r = ActivitySchema.safeParse({
      ...base,
      type: "unknown",
      payload: { algo_raro: 123 },
    });
    expect(r.success).toBe(true);
  });

  it("rechaza tipos fuera del enum", () => {
    const r = ActivitySchema.safeParse({
      ...base,
      type: "totally_invented",
      payload: {},
    });
    expect(r.success).toBe(false);
  });
});
