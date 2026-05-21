/**
 * Helpers puros de formateo para entidades Lead.
 *
 * Aislados del JSX para que sean testeables sin mount (Vitest unit). Estas
 * funciones NO dependen de TanStack Query, ni de React, ni de Clerk.
 */
import type { Lead } from "@/lib/api/hooks/use-leads";

/**
 * Compone "Nombre Apellido" con los nullables del backend.
 *
 * Reglas (acordadas con producto):
 *  1. Si hay `first_name` + `last_name` → "First Last".
 *  2. Si solo uno → ese.
 *  3. Si ninguno pero hay `email` → la parte local del email
 *     ("maria.garcia@ejemplo.com" → "maria.garcia").
 *  4. Si ni nombre ni email → `fallback` (default "Sin nombre").
 *
 * No se usa `company` como fallback aquí — la empresa va en su columna propia.
 */
export function composeLeadName(
  lead: Pick<Lead, "first_name" | "last_name" | "email">,
  fallback = "Sin nombre",
): string {
  const first = lead.first_name?.trim();
  const last = lead.last_name?.trim();
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (last) return last;
  const email = lead.email?.trim();
  if (email) {
    const at = email.indexOf("@");
    return at > 0 ? email.slice(0, at) : email;
  }
  return fallback;
}

/**
 * Iniciales para Avatar fallback (máximo 2 chars en mayúsculas).
 *
 * Reglas:
 *  - "María García" → "MG".
 *  - "María" → "MA".
 *  - "" / null → "?".
 */
export function composeInitials(
  lead: Pick<Lead, "first_name" | "last_name" | "email">,
): string {
  const first = lead.first_name?.trim() ?? "";
  const last = lead.last_name?.trim() ?? "";
  if (first && last) {
    return (first[0]! + last[0]!).toUpperCase();
  }
  const seed = first || last || lead.email?.split("@")[0] || "";
  if (!seed) return "?";
  // Primeras dos letras alfabéticas; si no llegan, una sola.
  const cleaned = seed.replace(/[^a-zA-ZÀ-ÿ]/g, "");
  if (cleaned.length >= 2) return cleaned.slice(0, 2).toUpperCase();
  if (cleaned.length === 1) return cleaned.toUpperCase();
  return seed[0]!.toUpperCase();
}

/**
 * Formatea un teléfono E.164 ("+34612345678") con espacios visuales según
 * el prefijo. Sin librería (libphonenumber-js es pesada — la añadimos solo
 * si necesitamos validación seria).
 *
 *  +34 612 345 678   (España: 9 dígitos)
 *  +351 912 345 678  (Portugal: 9 dígitos)
 *  +<otros>          (no agrupado — devolvemos tal cual)
 *
 * Valores inválidos o nulos → string vacío.
 */
export function formatPhone(phoneE164: string | null | undefined): string {
  if (!phoneE164) return "";
  const trimmed = phoneE164.trim();
  if (!trimmed.startsWith("+")) return trimmed;
  // ES +34 → 9 dígitos en grupos 3-3-3
  if (trimmed.startsWith("+34") && trimmed.length === 12) {
    return `+34 ${trimmed.slice(3, 6)} ${trimmed.slice(6, 9)} ${trimmed.slice(9, 12)}`;
  }
  // PT +351 → 9 dígitos en grupos 3-3-3
  if (trimmed.startsWith("+351") && trimmed.length === 13) {
    return `+351 ${trimmed.slice(4, 7)} ${trimmed.slice(7, 10)} ${trimmed.slice(10, 13)}`;
  }
  return trimmed;
}

/**
 * Convierte céntimos + ISO 4217 → "€ 1.234,56".
 *
 * Usa Intl.NumberFormat con locale `es-ES` (idioma base del CRM). Para
 * locales adicionales (`ca-ES`, `pt-PT`) lo parametrizamos cuando entre
 * `next-intl` en Sprint 6.
 */
export function formatMoney(
  cents: number | null | undefined,
  currency = "EUR",
): string {
  if (cents === null || cents === undefined) return "—";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Labels visibles para los enums LeadStatus / LeadSource.
 *
 * Los strings del backend son `snake_case` y técnicos; aquí los mapeamos a
 * la forma que ve el usuario. Si entran enums nuevos del backend
 * (regla cross-skill #7), el typecheck no fuerza la extensión — añadir
 * manualmente y testear.
 */
export const LEAD_STATUS_LABELS: Record<Lead["status"], string> = {
  new: "Nuevo",
  contacted: "Contactado",
  qualified: "Cualificado",
  won: "Ganado",
  lost: "Perdido",
};

export const LEAD_SOURCE_LABELS: Record<Lead["source"], string> = {
  manual: "Manual",
  whatsapp: "WhatsApp",
  web_form: "Formulario web",
  import: "Importación",
  referral: "Referido",
  agent: "Agente IA",
  other: "Otro",
};

/** Orden canónico del backend para Status (importante para Kanban / filtros). */
export const LEAD_STATUS_ORDER: ReadonlyArray<Lead["status"]> = [
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
];

export const LEAD_SOURCE_ORDER: ReadonlyArray<Lead["source"]> = [
  "manual",
  "whatsapp",
  "web_form",
  "import",
  "referral",
  "agent",
  "other",
];
