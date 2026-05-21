import { describe, expect, it } from "vitest";
import {
  CreateLeadFormSchema,
  defaultCreateLeadFormValues,
  formToLeadCreate,
} from "./create-lead-form";

const PIPELINE = "33333333-3333-3333-3333-333333333333";
const STAGE = "44444444-4444-4444-4444-440000000001";

function baseValid() {
  return {
    ...defaultCreateLeadFormValues,
    first_name: "María",
    pipeline_id: PIPELINE,
    stage_id: STAGE,
  };
}

describe("CreateLeadFormSchema", () => {
  it("acepta valores válidos mínimos", () => {
    const result = CreateLeadFormSchema.safeParse(baseValid());
    expect(result.success).toBe(true);
  });

  it("rechaza si falta nombre, apellido, empresa Y email", () => {
    const result = CreateLeadFormSchema.safeParse({
      ...defaultCreateLeadFormValues,
      pipeline_id: PIPELINE,
      stage_id: STAGE,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.toLowerCase().includes("al menos un nombre"),
        ),
      ).toBe(true);
    }
  });

  it("rechaza email malformado", () => {
    const result = CreateLeadFormSchema.safeParse({
      ...baseValid(),
      email: "no-es-email",
    });
    expect(result.success).toBe(false);
  });

  it("acepta email vacío", () => {
    const result = CreateLeadFormSchema.safeParse({
      ...baseValid(),
      email: "",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza teléfono sin + inicial", () => {
    const result = CreateLeadFormSchema.safeParse({
      ...baseValid(),
      phone: "612345678",
    });
    expect(result.success).toBe(false);
  });

  it("acepta teléfono válido con + y dígitos", () => {
    const result = CreateLeadFormSchema.safeParse({
      ...baseValid(),
      phone: "+34612345678",
    });
    expect(result.success).toBe(true);
  });

  it("acepta teléfono vacío", () => {
    const result = CreateLeadFormSchema.safeParse({
      ...baseValid(),
      phone: "",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza pipeline_id no UUID", () => {
    const result = CreateLeadFormSchema.safeParse({
      ...baseValid(),
      pipeline_id: "no-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza currency con longitud distinta a 3", () => {
    const result = CreateLeadFormSchema.safeParse({
      ...baseValid(),
      currency: "EUROS",
    });
    expect(result.success).toBe(false);
  });
});

describe("formToLeadCreate", () => {
  it("convierte euros a céntimos correctamente", () => {
    const out = formToLeadCreate({
      ...baseValid(),
      estimated_value_euros: "1200",
    });
    expect(out.estimated_value_cents).toBe(120000);
  });

  it("redondea decimales a céntimos enteros", () => {
    const out = formToLeadCreate({
      ...baseValid(),
      estimated_value_euros: "12.345",
    });
    // 12.345 € → 1234.5 céntimos → redondea a 1235
    expect(out.estimated_value_cents).toBe(1235);
  });

  it("omite estimated_value_cents si el campo está vacío", () => {
    const out = formToLeadCreate({
      ...baseValid(),
      estimated_value_euros: "",
    });
    expect(out.estimated_value_cents).toBeUndefined();
  });

  it("preserva cero como 0 céntimos", () => {
    const out = formToLeadCreate({
      ...baseValid(),
      estimated_value_euros: "0",
    });
    expect(out.estimated_value_cents).toBe(0);
  });

  it("mapea strings vacíos a undefined (no null)", () => {
    const out = formToLeadCreate({
      ...baseValid(),
      last_name: "",
      company: "",
      email: "",
      phone: "",
      source_ref: "",
    });
    expect(out.last_name).toBeUndefined();
    expect(out.company).toBeUndefined();
    expect(out.email).toBeUndefined();
    expect(out.phone).toBeUndefined();
    expect(out.source_ref).toBeUndefined();
  });

  it("envía tags como array (incluso vacío)", () => {
    const out = formToLeadCreate(baseValid());
    expect(out.tags).toEqual([]);
  });

  it("currency por defecto EUR cuando viene vacío", () => {
    const out = formToLeadCreate({ ...baseValid(), currency: "" });
    expect(out.currency).toBe("EUR");
  });
});
