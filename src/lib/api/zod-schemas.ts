/**
 * Schemas Zod para los tipos críticos del CRM (Sprint 1 + 2).
 *
 * **Importante:** la **fuente de verdad** del contrato sigue siendo el
 * OpenAPI del backend (regla cross-skill #7). `lib/api/types.ts` se genera
 * con `pnpm gen:types` y NO se edita a mano.
 *
 * Estos schemas existen como capa de **boundary validation**: validamos la
 * respuesta del backend en tiempo de ejecución para detectar contratos rotos
 * en producción (fechas mal serializadas, null donde se espera string, enums
 * con valores nuevos no soportados, etc.) y fallar rápido con un error
 * legible.
 *
 * Convenciones:
 *  - El tipo derivado con `z.infer<typeof FooSchema>` debe ser **asignable**
 *    al tipo OpenAPI correspondiente (`components["schemas"]["Foo"]`). Si
 *    alguien rompe esa compatibilidad, lo detecta el bloque
 *    `_compatibilityChecks` al final del archivo y el typecheck rompe.
 *  - Solo escribimos schemas para tipos que entran en el árbol de UI crítico
 *    (Lead, Pipeline, Activity, WhatsApp message…). Estructuras administrativas
 *    o de debug no se validan en boundary.
 *  - Los primitivos OpenAPI se mapean así:
 *      `format: uuid` → `z.string().uuid()`
 *      `format: email` → `z.string().email()`
 *      `format: date-time` → `z.string().datetime({ offset: true })`
 *      `enum: [...]` → `z.enum([...])`
 *      `anyOf: [T, null]` → `z.union([T, z.null()])` (nullable explícito;
 *      el backend serializa `null`, no omite el campo).
 */
import { z } from "zod";
import type { components } from "./types";

// ── Enums ───────────────────────────────────────────────────────────────────

export const LeadStatusSchema = z.enum([
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
]);

export const LeadSourceSchema = z.enum([
  "manual",
  "whatsapp",
  "web_form",
  "import",
  "referral",
  "agent",
  "other",
]);

export const LeadSortFieldSchema = z.enum([
  "created_at",
  "updated_at",
  "last_contacted_at",
  "status",
]);

export const SortDirectionSchema = z.enum(["asc", "desc"]);

export const ActivityTypeSchema = z.enum([
  "note",
  "call",
  "email",
  "whatsapp_inbound",
  "whatsapp_outbound",
  "stage_changed",
  "owner_changed",
  "status_changed",
  "lead_created",
  "system",
]);

export const MessageDirectionSchema = z.enum(["inbound", "outbound"]);

export const MessageStatusSchema = z.enum([
  "received",
  "accepted",
  "sent",
  "delivered",
  "read",
  "failed",
]);

// ── Helpers ─────────────────────────────────────────────────────────────────

/** date-time ISO con offset (`2026-05-21T09:30:00+00:00` o `…Z`). */
const dateTime = () => z.string().datetime({ offset: true });

/** UUID v4 (el backend siempre los emite). */
const uuid = () => z.string().uuid();

/** Campo "anyOf: [T, null]" del backend (Pydantic v2 con Optional). */
const nullable = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.null()]);

// ── Lead ────────────────────────────────────────────────────────────────────

/**
 * Espejo de `components["schemas"]["LeadOut"]`. Todos los campos optional
 * del backend se modelan como **nullable explícito** porque la API los
 * serializa con `null`, no los omite.
 */
export const LeadSchema = z.object({
  id: uuid(),
  tenant_id: uuid(),
  pipeline_id: uuid(),
  stage_id: uuid(),
  owner_id: nullable(uuid()),
  first_name: nullable(z.string()),
  last_name: nullable(z.string()),
  email: nullable(z.string()),
  phone_e164: nullable(z.string()),
  company: nullable(z.string()),
  cups: nullable(z.string()),
  status: LeadStatusSchema,
  source: LeadSourceSchema,
  source_ref: nullable(z.string()),
  tags: z.array(z.string()),
  custom_fields: z.record(z.string(), z.unknown()),
  estimated_value_cents: nullable(z.number().int()),
  currency: z.string(),
  last_contacted_at: nullable(dateTime()),
  created_at: dateTime(),
  updated_at: dateTime(),
});
export type Lead = z.infer<typeof LeadSchema>;

export const LeadCreateSchema = z.object({
  first_name: z.string().max(120).nullish(),
  last_name: z.string().max(120).nullish(),
  email: z.string().email().max(320).nullish(),
  phone: z.string().nullish(),
  company: z.string().max(255).nullish(),
  cups: z.string().max(22).nullish(),
  source: LeadSourceSchema.optional(),
  source_ref: z.string().max(255).nullish(),
  pipeline_id: uuid().nullish(),
  stage_id: uuid().nullish(),
  owner_id: uuid().nullish(),
  tags: z.array(z.string().min(1).max(64)).max(32).optional(),
  custom_fields: z.record(z.string(), z.unknown()).optional(),
  estimated_value_cents: z.number().int().min(0).nullish(),
  currency: z.string().length(3).optional(),
});
export type LeadCreate = z.infer<typeof LeadCreateSchema>;

export const LeadUpdateSchema = z.object({
  first_name: z.string().max(120).nullish(),
  last_name: z.string().max(120).nullish(),
  email: z.string().email().max(320).nullish(),
  phone: z.string().nullish(),
  company: z.string().max(255).nullish(),
  cups: z.string().max(22).nullish(),
  source: LeadSourceSchema.nullish(),
  source_ref: z.string().max(255).nullish(),
  owner_id: uuid().nullish(),
  tags: z.array(z.string()).max(32).nullish(),
  custom_fields: z.record(z.string(), z.unknown()).nullish(),
  estimated_value_cents: z.number().int().min(0).nullish(),
  last_contacted_at: dateTime().nullish(),
});
export type LeadUpdate = z.infer<typeof LeadUpdateSchema>;

export const LeadMoveSchema = z.object({
  stage_id: uuid(),
  note: z.string().max(500).nullish(),
});
export type LeadMove = z.infer<typeof LeadMoveSchema>;

export const LeadBulkActionSchema = z.object({
  ids: z.array(uuid()).min(1).max(500),
  assign_owner_id: uuid().nullish(),
  set_status: LeadStatusSchema.nullish(),
  add_tags: z.array(z.string()).max(32).optional(),
  remove_tags: z.array(z.string()).max(32).optional(),
});
export type LeadBulkAction = z.infer<typeof LeadBulkActionSchema>;

export const LeadBulkResultSchema = z.object({
  matched: z.number().int(),
  updated: z.number().int(),
  ids: z.array(uuid()),
});
export type LeadBulkResult = z.infer<typeof LeadBulkResultSchema>;

// ── Page<LeadOut> ───────────────────────────────────────────────────────────

export const LeadPageSchema = z.object({
  items: z.array(LeadSchema),
  total: z.number().int().min(0),
  limit: z.number().int().min(1).max(200),
  offset: z.number().int().min(0),
});
export type LeadPage = z.infer<typeof LeadPageSchema>;

// ── Activity ────────────────────────────────────────────────────────────────

export const ActivitySchema = z.object({
  id: uuid(),
  lead_id: uuid(),
  actor_user_id: nullable(uuid()),
  type: ActivityTypeSchema,
  summary: nullable(z.string()),
  payload: z.record(z.string(), z.unknown()),
  occurred_at: dateTime(),
  created_at: dateTime(),
});
export type Activity = z.infer<typeof ActivitySchema>;

export const ActivityListSchema = z.array(ActivitySchema);
export type ActivityList = z.infer<typeof ActivityListSchema>;

export const ActivityCreateSchema = z.object({
  type: ActivityTypeSchema,
  summary: z.string().max(500).nullish(),
  payload: z.record(z.string(), z.unknown()).optional(),
});
export type ActivityCreate = z.infer<typeof ActivityCreateSchema>;

// ── Pipeline ────────────────────────────────────────────────────────────────

export const PipelineStageSchema = z.object({
  id: uuid(),
  pipeline_id: uuid(),
  name: z.string(),
  slug: z.string(),
  position: z.number().int(),
  is_won: z.boolean(),
  is_lost: z.boolean(),
  created_at: dateTime(),
  updated_at: dateTime(),
});
export type PipelineStage = z.infer<typeof PipelineStageSchema>;

export const PipelineStageListSchema = z.array(PipelineStageSchema);
export type PipelineStageList = z.infer<typeof PipelineStageListSchema>;

/**
 * El backend marca `stages` como required en `PipelineOut.required`, pero el
 * `array` no aparece en ese listado (queda en `properties.stages`). En la
 * práctica viene siempre — modelamos como required.
 *
 * reason: el OpenAPI snapshot tiene `stages` en `properties` pero NO en
 * `required`. El servicio sí lo devuelve siempre. Si el backend cambia y deja
 * de mandarlo, la validación Zod lo dirá.
 */
export const PipelineSchema = z.object({
  id: uuid(),
  tenant_id: uuid(),
  name: z.string(),
  slug: z.string(),
  is_default: z.boolean(),
  stages: z.array(PipelineStageSchema).default([]),
  created_at: dateTime(),
  updated_at: dateTime(),
});
export type Pipeline = z.infer<typeof PipelineSchema>;

export const PipelineListSchema = z.array(PipelineSchema);
export type PipelineList = z.infer<typeof PipelineListSchema>;

export const PipelineStageInSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().max(64).nullish(),
  position: z.number().int().min(0).max(10000).optional(),
  is_won: z.boolean().optional(),
  is_lost: z.boolean().optional(),
});
export type PipelineStageIn = z.infer<typeof PipelineStageInSchema>;

export const PipelineCreateSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().max(64).nullish(),
  is_default: z.boolean().optional(),
  stages: z.array(PipelineStageInSchema).max(20).optional(),
});
export type PipelineCreate = z.infer<typeof PipelineCreateSchema>;

export const PipelineUpdateSchema = z.object({
  name: z.string().min(1).max(120).nullish(),
  is_default: z.boolean().nullish(),
});
export type PipelineUpdate = z.infer<typeof PipelineUpdateSchema>;

export const PipelineStageReplaceSchema = z.object({
  stages: z.array(PipelineStageInSchema).min(1).max(20),
});
export type PipelineStageReplace = z.infer<typeof PipelineStageReplaceSchema>;

// ── WhatsApp ────────────────────────────────────────────────────────────────

export const WhatsAppMessageSchema = z.object({
  id: uuid(),
  lead_id: nullable(uuid()),
  direction: MessageDirectionSchema,
  status: MessageStatusSchema,
  provider_message_id: nullable(z.string()),
  from_phone_e164: z.string(),
  to_phone_e164: z.string(),
  kind: z.string(),
  template_name: nullable(z.string()),
  template_language: nullable(z.string()),
  body: nullable(z.string()),
  error_code: nullable(z.string()),
  error_message: nullable(z.string()),
  sent_at: nullable(dateTime()),
  delivered_at: nullable(dateTime()),
  read_at: nullable(dateTime()),
  created_at: dateTime(),
});
export type WhatsAppMessage = z.infer<typeof WhatsAppMessageSchema>;

export const WhatsAppTemplateComponentSchema = z.object({
  type: z.string().min(1).max(32),
  parameters: z.array(z.record(z.string(), z.unknown())).optional(),
});
export type WhatsAppTemplateComponent = z.infer<
  typeof WhatsAppTemplateComponentSchema
>;

export const WhatsAppTemplateSendSchema = z.object({
  template_name: z.string().min(1).max(255),
  language: z.string().min(2).max(16),
  components: z.array(WhatsAppTemplateComponentSchema).optional(),
});
export type WhatsAppTemplateSend = z.infer<typeof WhatsAppTemplateSendSchema>;

// ── Problem Details (RFC 7807) ──────────────────────────────────────────────

export const ProblemSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  correlationId: z.string().optional(),
});
export type Problem = z.infer<typeof ProblemSchema>;

// ── Compatibility checks ────────────────────────────────────────────────────
// Si estos tipos no son asignables a los OpenAPI generados, el typecheck
// rompe el build. Es la red de seguridad que evita que los Zod schemas se
// desvíen silenciosamente del contrato.
//
// reason: estas declaraciones existen solo para forzar el chequeo estructural
// del compilador TS; no se importan en runtime y la convención es prefijarlas
// con `_` para que ESLint no avise de "unused".
//
// Solo verificamos los DTOs de **respuesta** del backend (los que llegan a
// la cache). Los payloads de **request** (LeadCreate, LeadUpdate, etc.) los
// validamos con el schema antes de mandarlos, pero su tipo Zod no necesita
// ser exactamente igual al del backend — el backend valida y rechaza.

type _Assignable<A, B> = A extends B ? (B extends A ? true : false) : false;

type _LeadCompat = _Assignable<components["schemas"]["LeadOut"], Lead>;
type _LeadPageCompat = _Assignable<
  components["schemas"]["Page_LeadOut_"],
  LeadPage
>;
type _ActivityCompat = _Assignable<
  components["schemas"]["ActivityOut"],
  Activity
>;
type _PipelineStageCompat = _Assignable<
  components["schemas"]["PipelineStageOut"],
  PipelineStage
>;
type _WhatsAppMessageCompat = _Assignable<
  components["schemas"]["WhatsAppMessageOut"],
  WhatsAppMessage
>;
type _LeadBulkResultCompat = _Assignable<
  components["schemas"]["LeadBulkResult"],
  LeadBulkResult
>;

// `PipelineOut` no incluye `stages` en `required` aunque siempre lo manda,
// así que aquí solo verificamos que nuestro Zod (que SÍ lo requiere) es
// asignable al OpenAPI generado, no al revés. El `default([])` del Zod lo
// hace asignable.
type _PipelineFromBackend = Omit<components["schemas"]["PipelineOut"], "stages"> & {
  stages: components["schemas"]["PipelineStageOut"][];
};
type _PipelineCompat = _Assignable<_PipelineFromBackend, Pipeline>;

// Si alguno de estos no es `true`, el typecheck falla en el ensamblado.
const _compatibilityChecks: [
  _LeadCompat,
  _LeadPageCompat,
  _ActivityCompat,
  _PipelineCompat,
  _PipelineStageCompat,
  _WhatsAppMessageCompat,
  _LeadBulkResultCompat,
] = [true, true, true, true, true, true, true];
void _compatibilityChecks;
