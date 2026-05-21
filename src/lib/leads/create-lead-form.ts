import { z } from "zod";
import type { components } from "@/lib/api/types";
import { LEAD_SOURCE_ORDER } from "./format";

/**
 * reason: el tipo `LeadCreate` del Zod (zod-schemas) marca `currency` opcional
 * porque el backend tiene default 'EUR'. Pero el `paths` generado del OpenAPI
 * tipa `currency` como required (consecuencia del default explícito en el
 * schema Pydantic). Para que el mapper coincida con la firma de
 * `useApiMutation<"/v1/leads", "post">` usamos el tipo del OpenAPI.
 */
type LeadCreateBody = components["schemas"]["LeadCreate"];

/**
 * Schema Zod para el formulario de creación de Lead (F-2.10).
 *
 * **Por qué no reutilizamos `LeadCreateSchema` del backend**:
 *  - El backend acepta `nullish` en casi todo y normaliza después; el form
 *    debe ser más estricto (mejor UX: error temprano antes de enviar).
 *  - Aquí pedimos al menos UNO de first_name/last_name/company/email.
 *  - Validamos phone con regex `+<digits>` o cadena vacía.
 *  - Pedimos email RFC válido si está presente.
 *  - `estimated_value_euros` está en EUROS (input usable), el mapper lo
 *    convierte a céntimos para el backend.
 *
 * El mapper `formToLeadCreate` (más abajo) traduce esta forma de UI a la
 * forma que espera el backend (`LeadCreate`).
 */

/** Regex teléfono: opcional empty, o `+` seguido de 8-15 dígitos. */
const PHONE_REGEX = /^(\+\d{8,15})?$/;

/**
 * UUID "laxo" (8-4-4-4-12 hex), sin enforce de la versión RFC 4122. El
 * backend genera UUID v4 reales pero las fixtures/seeds usan IDs deter-
 * minísticos como `33333333-...` que no cumplen v4. Para el form, basta
 * con que la forma sea correcta.
 */
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const CreateLeadFormSchema = z
  .object({
    first_name: z.string().trim().max(120, "Máximo 120 caracteres."),
    last_name: z.string().trim().max(120, "Máximo 120 caracteres."),
    company: z.string().trim().max(255, "Máximo 255 caracteres."),
    email: z
      .string()
      .trim()
      .max(320, "Máximo 320 caracteres.")
      // reason: z.string().email() rechaza la cadena vacía. Permitimos vacío
      // y solo validamos formato cuando hay valor (formulario flexible).
      .refine(
        (v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        { message: "Email no válido." },
      ),
    phone: z
      .string()
      .trim()
      .refine((v) => PHONE_REGEX.test(v), {
        message: "Debe empezar por + y tener 8 a 15 dígitos.",
      }),
    source: z.enum(LEAD_SOURCE_ORDER as readonly [string, ...string[]]),
    pipeline_id: z
      .string()
      .regex(UUID_REGEX, "Pipeline no válido."),
    stage_id: z.string().regex(UUID_REGEX, "Etapa no válida."),
    tags: z.array(z.string().min(1).max(64)).max(32),
    estimated_value_euros: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || (Number.isFinite(Number(v)) && Number(v) >= 0),
        { message: "Importe inválido." },
      ),
    currency: z.string().length(3, "Código ISO 4217 (3 letras).").toUpperCase(),
    source_ref: z.string().trim().max(255, "Máximo 255 caracteres."),
  })
  .refine(
    (v) =>
      Boolean(v.first_name || v.last_name || v.company || v.email),
    {
      message:
        "Necesitas al menos un nombre, apellido, empresa o email.",
      path: ["first_name"],
    },
  );

export type CreateLeadFormValues = z.infer<typeof CreateLeadFormSchema>;

/**
 * Defaults del form. `pipeline_id` y `stage_id` los inyecta el caller
 * cuando los pipelines hayan cargado.
 */
export const defaultCreateLeadFormValues: CreateLeadFormValues = {
  first_name: "",
  last_name: "",
  company: "",
  email: "",
  phone: "",
  source: "manual",
  pipeline_id: "",
  stage_id: "",
  tags: [],
  estimated_value_euros: "",
  currency: "EUR",
  source_ref: "",
};

/**
 * Mapper UI → request body del backend.
 *
 * Reglas:
 *  - Strings vacíos se mapean a `undefined` para que el backend trate
 *    "no se proporcionó" en vez de "se quiere null explícito". Excepción
 *    documentada: `phone` con `''` se trata como reset-to-null en UPDATE
 *    (deuda backend), pero en CREATE NO aplica — backend ignora `phone`
 *    vacío y lo deja null por defecto. Aquí lo enviamos como undefined.
 *  - `estimated_value_euros` (string en EUROS) → céntimos (entero).
 *    "0" se preserva como 0; "" se omite.
 *  - `tags` siempre como array (incluso `[]`).
 */
export function formToLeadCreate(values: CreateLeadFormValues): LeadCreateBody {
  const cents = (() => {
    if (values.estimated_value_euros === "") return undefined;
    const n = Number(values.estimated_value_euros);
    if (!Number.isFinite(n)) return undefined;
    return Math.round(n * 100);
  })();

  return {
    first_name: values.first_name || undefined,
    last_name: values.last_name || undefined,
    company: values.company || undefined,
    email: values.email || undefined,
    phone: values.phone || undefined,
    source: values.source as LeadCreateBody["source"],
    pipeline_id: values.pipeline_id,
    stage_id: values.stage_id,
    tags: values.tags,
    estimated_value_cents: cents,
    currency: values.currency || "EUR",
    source_ref: values.source_ref || undefined,
  };
}

/** Helper: parsea un Problem RFC 7807 a un mapa { field: errorMessage }. */
export function extractFieldErrors(
  error: unknown,
): { fieldErrors: Record<string, string>; general: string | null } {
  const fieldErrors: Record<string, string> = {};
  let general: string | null = null;
  if (!error || typeof error !== "object") return { fieldErrors, general };

  // Convención: el backend puede meter `errors: [{ path, message }]` como
  // extensión del Problem o `detail: string` libre.
  const err = error as {
    detail?: string;
    title?: string;
    message?: string;
    errors?: Array<{ path?: string; message?: string }>;
  };
  if (Array.isArray(err.errors)) {
    for (const e of err.errors) {
      if (e.path && e.message) fieldErrors[e.path] = e.message;
    }
  }
  general = err.detail ?? err.title ?? err.message ?? null;
  return { fieldErrors, general };
}
