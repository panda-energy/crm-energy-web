import type { components } from "@/lib/api/types";
import { TENANT_ID } from "./pipelines";

type ProductOut = components["schemas"]["ProductOut"];

/**
 * 5 productos fixture con pricing realista espanol.
 * UUIDs con patrón `66666666-6666-6666-6666-66…`.
 */

const seededAt = "2026-04-10T08:00:00.000Z";

export const PRODUCT_IDS = {
  p1: "66666666-6666-6666-6666-660000000001",
  p2: "66666666-6666-6666-6666-660000000002",
  p3: "66666666-6666-6666-6666-660000000003",
  p4: "66666666-6666-6666-6666-660000000004",
  p5: "66666666-6666-6666-6666-660000000005",
} as const;

export const PRODUCT_FIXTURES: ProductOut[] = [
  {
    id: PRODUCT_IDS.p1,
    tenant_id: TENANT_ID,
    code: "FIX-2.0TD-12",
    name: "Tarifa Fija Hogar 2.0TD",
    energy_type: "electricity",
    tariff_kind: "fixed",
    term_months: 12,
    currency: "EUR",
    pricing: {
      energy_eur_per_kwh: 0.12,
      power_eur_per_kw_day: 0.085,
      fixed_monthly_eur: 3.5,
    },
    notes: "Tarifa fija 12 meses para residencial con 2.0TD",
    status: "active",
    created_at: seededAt,
    updated_at: seededAt,
  },
  {
    id: PRODUCT_IDS.p2,
    tenant_id: TENANT_ID,
    code: "IDX-2.0TD-12",
    name: "Tarifa Indexada OMIE 2.0TD",
    energy_type: "electricity",
    tariff_kind: "indexed_omie",
    term_months: 12,
    currency: "EUR",
    pricing: {
      margin_eur_per_kwh: 0.005,
      power_eur_per_kw_day: 0.08,
      fixed_monthly_eur: 2.0,
    },
    notes: "Indexada al pool OMIE + margen de 0.005 EUR/kWh",
    status: "active",
    created_at: seededAt,
    updated_at: seededAt,
  },
  {
    id: PRODUCT_IDS.p3,
    tenant_id: TENANT_ID,
    code: "FIX-3.0TD-24",
    name: "Tarifa Fija PYME 3.0TD",
    energy_type: "electricity",
    tariff_kind: "multi_period",
    term_months: 24,
    currency: "EUR",
    pricing: {
      energy_p1_eur_per_kwh: 0.15,
      energy_p2_eur_per_kwh: 0.11,
      energy_p3_eur_per_kwh: 0.09,
      power_eur_per_kw_day: 0.1,
      fixed_monthly_eur: 5.0,
    },
    notes: "Multi-periodo para PYME con 3.0TD, contrato 24 meses",
    status: "active",
    created_at: seededAt,
    updated_at: seededAt,
  },
  {
    id: PRODUCT_IDS.p4,
    tenant_id: TENANT_ID,
    code: "GAS-RL1-12",
    name: "Gas Natural RL.1 Hogar",
    energy_type: "gas",
    tariff_kind: "fixed",
    term_months: 12,
    currency: "EUR",
    pricing: {
      energy_eur_per_kwh: 0.065,
      fixed_monthly_eur: 4.5,
    },
    notes: "Gas natural fijo para hogares, tarifa RL.1",
    status: "active",
    created_at: seededAt,
    updated_at: seededAt,
  },
  {
    id: PRODUCT_IDS.p5,
    tenant_id: TENANT_ID,
    code: "FIX-6.1TD-12",
    name: "Tarifa Fija Industrial 6.1TD",
    energy_type: "electricity",
    tariff_kind: "multi_period",
    term_months: 12,
    currency: "EUR",
    pricing: {
      energy_p1_eur_per_kwh: 0.18,
      energy_p2_eur_per_kwh: 0.14,
      energy_p3_eur_per_kwh: 0.11,
      energy_p4_eur_per_kwh: 0.09,
      energy_p5_eur_per_kwh: 0.08,
      energy_p6_eur_per_kwh: 0.07,
      power_eur_per_kw_day: 0.12,
      fixed_monthly_eur: 15.0,
    },
    notes: null,
    status: "draft",
    created_at: seededAt,
    updated_at: seededAt,
  },
];
