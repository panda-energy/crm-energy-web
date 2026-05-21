import { describe, expect, it } from "vitest";
import type { Lead } from "@/lib/api/hooks/use-leads";
import {
  composeInitials,
  composeLeadName,
  formatMoney,
  formatPhone,
} from "./format";

/**
 * Tests puros sobre los helpers de formato. No tocan React.
 */

type NameLike = Pick<Lead, "first_name" | "last_name" | "email">;

describe("composeLeadName", () => {
  it("compone nombre + apellido cuando ambos están", () => {
    const lead: NameLike = {
      first_name: "María",
      last_name: "García",
      email: null,
    };
    expect(composeLeadName(lead)).toBe("María García");
  });

  it("usa solo el campo presente cuando falta uno", () => {
    expect(
      composeLeadName({ first_name: "María", last_name: null, email: null }),
    ).toBe("María");
    expect(
      composeLeadName({ first_name: null, last_name: "García", email: null }),
    ).toBe("García");
  });

  it("usa la parte local del email si faltan nombres", () => {
    expect(
      composeLeadName({
        first_name: null,
        last_name: null,
        email: "maria.garcia@ejemplo.com",
      }),
    ).toBe("maria.garcia");
  });

  it("devuelve fallback cuando todo está vacío", () => {
    expect(
      composeLeadName({ first_name: null, last_name: null, email: null }),
    ).toBe("Sin nombre");
    expect(
      composeLeadName({ first_name: "  ", last_name: "", email: "" }, "—"),
    ).toBe("—");
  });
});

describe("composeInitials", () => {
  it("usa la inicial de first + last", () => {
    expect(
      composeInitials({ first_name: "María", last_name: "García", email: null }),
    ).toBe("MG");
  });

  it("usa dos chars del único nombre disponible", () => {
    expect(
      composeInitials({ first_name: "María", last_name: null, email: null }),
    ).toBe("MA");
  });

  it("usa el email cuando no hay nombre", () => {
    expect(
      composeInitials({
        first_name: null,
        last_name: null,
        email: "rui@ejemplo.com",
      }),
    ).toBe("RU");
  });

  it("devuelve ? cuando no hay datos", () => {
    expect(
      composeInitials({ first_name: null, last_name: null, email: null }),
    ).toBe("?");
  });
});

describe("formatPhone", () => {
  it("agrupa números españoles 3-3-3", () => {
    expect(formatPhone("+34612345678")).toBe("+34 612 345 678");
  });

  it("agrupa números portugueses 3-3-3", () => {
    expect(formatPhone("+351912345678")).toBe("+351 912 345 678");
  });

  it("deja números desconocidos tal cual", () => {
    expect(formatPhone("+19295552671")).toBe("+19295552671");
  });

  it("devuelve cadena vacía para null/undefined/vacío", () => {
    expect(formatPhone(null)).toBe("");
    expect(formatPhone(undefined)).toBe("");
    expect(formatPhone("")).toBe("");
  });
});

describe("formatMoney", () => {
  it("convierte céntimos a euros y formatea con locale es-ES", () => {
    // 120000 céntimos = 1.200,00 €. El separador de miles depende de la
    // ICU disponible (Node 20 con full-icu vs jsdom): aceptamos ambas formas.
    const formatted = formatMoney(120000);
    expect(formatted).toMatch(/1\.?200,00/);
    expect(formatted).toMatch(/€/);
  });

  it("convierte céntimos pequeños correctamente", () => {
    expect(formatMoney(50)).toMatch(/0,50/);
  });

  it("muestra dash em para nulos", () => {
    expect(formatMoney(null)).toBe("—");
    expect(formatMoney(undefined)).toBe("—");
  });
});
