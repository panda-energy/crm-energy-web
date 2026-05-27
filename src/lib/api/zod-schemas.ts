/**
 * Schemas Zod para los tipos críticos del CRM (Sprint 1 + 2 + cleanup wave).
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

/**
 * Discriminator value for ActivityOut variants. El backend (cleanup wave)
 * añadió `restored`, `bulk_action` y la variante de fallback `unknown` al
 * enum oficial.
 */
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
  "restored",
  "bulk_action",
  "system",
  "unknown",
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

export const UserRoleSchema = z.enum(["admin", "sales", "agent", "viewer"]);

// ── Helpers ─────────────────────────────────────────────────────────────────

/** date-time ISO con offset (`2026-05-21T09:30:00+00:00` o `…Z`). */
const dateTime = () => z.string().datetime({ offset: true });

/**
 * UUID en formato canónico 8-4-4-4-12 (hex). Permisivo entre versiones —
 * acepta v1, v4, v5 y "nil"-style. Los fixtures MSW usan UUIDs determinísticos
 * (`33333333-3333-3333-3333-333333333333`) que NO son v4 estrictos pero sí
 * son sintácticamente UUIDs válidos. El backend real emite v4; ambos pasan.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuid = () => z.string().regex(UUID_RE, { message: "Invalid UUID" });

/** Campo "anyOf: [T, null]" del backend (Pydantic v2 con Optional). */
const nullable = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.null()]);

/**
 * E.164 strict — `+` seguido de 1-15 dígitos con primer dígito 1-9.
 *
 * Espejo del pattern declarado por el backend en `LeadCreate.phone` y
 * `LeadUpdate.phone`: `^\+?[1-9]\d{1,14}$`. Aquí endurecemos a `\+` obli-
 * gatorio porque el frontend NO acepta inputs ambiguos — el backend sí
 * normaliza variantes (`34600…`, `0034600…`, etc.) pero la UI siempre
 * muestra y guarda E.164 estricto para evitar disonancia.
 *
 * El backend permite además `''` (string vacío) y `null` en LeadUpdate como
 * señales explícitas de "borrar teléfono"; ver `LeadUpdateSchema.phone`.
 */
export const PHONE_E164_PATTERN = /^\+[1-9]\d{1,14}$/;
export const phoneE164Schema = z
  .string()
  .regex(PHONE_E164_PATTERN, "Teléfono no válido (formato E.164: +<país><número>).");

// ── Lead ────────────────────────────────────────────────────────────────────

/**
 * Espejo de `components["schemas"]["LeadOut"]`. Todos los campos optional
 * del backend se modelan como **nullable explícito** porque la API los
 * serializa con `null`, no los omite.
 *
 * Cleanup wave: `position` (int | null) describe el orden del lead dentro
 * de su stage; `null` significa "al final" (default legacy).
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
  // reason: el OpenAPI marca `position` como propiedad opcional (no en
  // required[]) y nullable. Lo modelamos como `int | null` opcional: el
  // backend lo OMITE solo en respuestas pre-cleanup; en datos nuevos siempre
  // viene (puede ser `null` = al final).
  position: nullable(z.number().int()).optional(),
  created_at: dateTime(),
  updated_at: dateTime(),
});
export type Lead = z.infer<typeof LeadSchema>;

/**
 * `phone` en CREATE acepta E.164 estricto. Vacío NO se permite (regla UI:
 * crear lead con teléfono debe ser una decisión consciente).
 */
export const LeadCreateSchema = z.object({
  first_name: z.string().max(120).nullish(),
  last_name: z.string().max(120).nullish(),
  email: z.string().email().max(320).nullish(),
  phone: phoneE164Schema.nullish(),
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

/**
 * `phone` en UPDATE acepta tres formas semánticas distintas (cleanup wave
 * formalizó el comportamiento):
 *  - **Omitido** (clave ausente) → no se toca.
 *  - **`''` (string vacío) o `null`** → reset explícito a null en la BD.
 *  - **E.164 estricto** → se valida con `phoneE164Schema` antes de mandar.
 *
 * Por eso no usamos `phoneE164Schema.nullish()`: el regex rechazaría `''`.
 * Hacemos un union con literal vacío + null + E.164.
 */
export const LeadUpdateSchema = z.object({
  first_name: z.string().max(120).nullish(),
  last_name: z.string().max(120).nullish(),
  email: z.string().email().max(320).nullish(),
  phone: z
    .union([z.literal(""), phoneE164Schema, z.null()])
    .optional(),
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

/**
 * Cleanup wave: añadido `position` opcional para insertar el lead en una
 * posición específica del stage destino. `null` o ausente = al final
 * (backend lo clampa a `[0, len(stage)]`).
 */
export const LeadMoveSchema = z.object({
  stage_id: uuid(),
  position: z.number().int().min(0).max(1_000_000).nullish(),
  note: z.string().max(500).nullish(),
});
export type LeadMove = z.infer<typeof LeadMoveSchema>;

/**
 * Cleanup wave: `action` discrimina entre `update` (mutaciones in-place) y
 * `delete` (soft-delete). Cuando `action === 'delete'` los demás campos
 * se ignoran; los IDs eliminados pueden recuperarse vía
 * `POST /v1/leads/{id}/restore` mientras siga el undo (6s).
 */
export const LeadBulkActionSchema = z.object({
  ids: z.array(uuid()).min(1).max(500),
  action: z.enum(["update", "delete"]).optional(),
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

// ── Activity (cleanup wave: unión discriminada por `type`) ─────────────────

/**
 * Base shape compartido por TODAS las variantes de `ActivityOut`. Cada
 * variante añade `type` literal + `payload` tipado.
 *
 * El backend emite estas variantes en `/v1/leads/{id}/activities` (GET +
 * POST). El discriminador es el campo `type`; usamos
 * `z.discriminatedUnion` para narrowing exhaustivo en la UI.
 */
const activityBase = {
  id: uuid(),
  lead_id: uuid(),
  actor_user_id: nullable(uuid()),
  summary: nullable(z.string()),
  occurred_at: dateTime(),
  created_at: dateTime(),
};

/** `note` — nota libre creada manualmente. `payload.body` es el cuerpo. */
export const NoteActivitySchema = z.object({
  ...activityBase,
  type: z.literal("note"),
  payload: z
    .object({
      body: nullable(z.string()).optional(),
    })
    .passthrough(),
});

/** `call` — log de llamada. `payload.outcome` + `payload.duration_sec`. */
export const CallActivitySchema = z.object({
  ...activityBase,
  type: z.literal("call"),
  payload: z
    .object({
      outcome: nullable(z.string()).optional(),
      duration_sec: nullable(z.number().int().min(0)).optional(),
    })
    .passthrough(),
});

/** `email` — log de email manual. `payload.subject` + `payload.body`. */
export const EmailActivitySchema = z.object({
  ...activityBase,
  type: z.literal("email"),
  payload: z
    .object({
      subject: nullable(z.string()).optional(),
      body: nullable(z.string()).optional(),
    })
    .passthrough(),
});

/** `whatsapp_inbound` — mensaje del cliente final. */
export const WhatsAppInboundActivitySchema = z.object({
  ...activityBase,
  type: z.literal("whatsapp_inbound"),
  payload: z
    .object({
      text: nullable(z.string()).optional(),
      template_name: nullable(z.string()).optional(),
      wamid: nullable(z.string()).optional(),
    })
    .passthrough(),
});

/** `whatsapp_outbound` — mensaje saliente vía Meta Cloud. */
export const WhatsAppOutboundActivitySchema = z.object({
  ...activityBase,
  type: z.literal("whatsapp_outbound"),
  payload: z
    .object({
      text: nullable(z.string()).optional(),
      template_name: nullable(z.string()).optional(),
      wamid: nullable(z.string()).optional(),
    })
    .passthrough(),
});

/** `stage_changed` — backend emite este al ejecutar `/move`. */
export const StageChangedActivitySchema = z.object({
  ...activityBase,
  type: z.literal("stage_changed"),
  payload: z
    .object({
      from_stage_id: nullable(uuid()).optional(),
      from_stage_name: nullable(z.string()).optional(),
      to_stage_id: uuid(),
      to_stage_name: nullable(z.string()).optional(),
      note: nullable(z.string()).optional(),
    })
    .passthrough(),
});

/** `status_changed` — bucket coarse cambió (típicamente derivado de move). */
export const StatusChangedActivitySchema = z.object({
  ...activityBase,
  type: z.literal("status_changed"),
  payload: z
    .object({
      from_status: nullable(z.string()).optional(),
      to_status: z.string(),
    })
    .passthrough(),
});

/** `owner_changed` — asignación o reasignación de propietario. */
export const OwnerChangedActivitySchema = z.object({
  ...activityBase,
  type: z.literal("owner_changed"),
  payload: z
    .object({
      from_owner_id: nullable(uuid()).optional(),
      to_owner_id: nullable(uuid()).optional(),
    })
    .passthrough(),
});

/** `lead_created` — entrada en el funnel. */
export const LeadCreatedActivitySchema = z.object({
  ...activityBase,
  type: z.literal("lead_created"),
  payload: z
    .object({
      pipeline_id: nullable(uuid()).optional(),
      stage_id: nullable(uuid()).optional(),
      source: nullable(z.string()).optional(),
    })
    .passthrough(),
});

/**
 * `restored` — soft-delete revertido (típicamente por undo dentro de la
 * ventana de 6s, pero el endpoint es idempotente).
 */
export const RestoredActivitySchema = z.object({
  ...activityBase,
  type: z.literal("restored"),
  payload: z
    .object({
      restored_from: nullable(dateTime()).optional(),
    })
    .passthrough(),
});

/**
 * `bulk_action` — auditoría dejada por una mutación masiva en cada lead
 * afectado. `payload.action` identifica la operación; `payload.params`
 * preserva los argumentos para forensics.
 */
export const BulkActionActivitySchema = z.object({
  ...activityBase,
  type: z.literal("bulk_action"),
  payload: z
    .object({
      action: z.string(),
      params: z.record(z.string(), z.unknown()).optional(),
    })
    .passthrough(),
});

/** `system` — eventos genéricos del sistema (catch-all auditable). */
export const SystemActivitySchema = z.object({
  ...activityBase,
  type: z.literal("system"),
  payload: z.record(z.string(), z.unknown()),
});

/**
 * `unknown` — fallback de forward-compat: el backend marca con este tipo
 * cualquier entrada cuyo `activities.type` legacy no esté en el vocabulario
 * actual. La UI debe renderizar un entry genérico mostrando `summary` +
 * preservando el `payload` opaco para inspección.
 */
export const UnknownActivitySchema = z.object({
  ...activityBase,
  type: z.literal("unknown"),
  payload: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Unión discriminada sobre `type`. El consumidor obtiene narrowing
 * exhaustivo en switch/case sin runtime checks defensivos. Sustituye al
 * helper obsoleto `extractActivityDelta` (cleanup wave).
 */
export const ActivitySchema = z.discriminatedUnion("type", [
  NoteActivitySchema,
  CallActivitySchema,
  EmailActivitySchema,
  WhatsAppInboundActivitySchema,
  WhatsAppOutboundActivitySchema,
  StageChangedActivitySchema,
  StatusChangedActivitySchema,
  OwnerChangedActivitySchema,
  LeadCreatedActivitySchema,
  RestoredActivitySchema,
  BulkActionActivitySchema,
  SystemActivitySchema,
  UnknownActivitySchema,
]);
export type Activity = z.infer<typeof ActivitySchema>;

export const ActivityListSchema = z.array(ActivitySchema);
export type ActivityList = z.infer<typeof ActivityListSchema>;

/** Solo tipos manuales (note/call/email) son creables por la UI. */
export const ActivityCreateSchema = z.object({
  type: z.enum(["note", "call", "email"]),
  summary: z.string().max(500).nullish(),
  payload: z.record(z.string(), z.unknown()).optional(),
});
export type ActivityCreate = z.infer<typeof ActivityCreateSchema>;

// ── Pipeline ────────────────────────────────────────────────────────────────

/**
 * Cleanup wave: `entry_criteria` añadido al schema. Es un array (o null)
 * cuyos elementos pueden ser shorthands string (id de un criterio
 * registrado) o objetos `{ type, params }`. Sprint 2 trata este campo como
 * **lectura informativa**; en Sprint 3 el motor de auto-stage lo consumirá.
 */
export const PipelineStageSchema = z.object({
  id: uuid(),
  pipeline_id: uuid(),
  name: z.string(),
  slug: z.string(),
  position: z.number().int(),
  is_won: z.boolean(),
  is_lost: z.boolean(),
  entry_criteria: nullable(z.array(z.unknown())).optional(),
  created_at: dateTime(),
  updated_at: dateTime(),
});
export type PipelineStage = z.infer<typeof PipelineStageSchema>;

export const PipelineStageListSchema = z.array(PipelineStageSchema);
export type PipelineStageList = z.infer<typeof PipelineStageListSchema>;

/**
 * Cleanup wave: `stages` ahora viene en `required`; eliminamos el
 * workaround `.default([])` que rellenaba defensivamente la lista cuando
 * el contrato declaraba el campo como opcional.
 */
export const PipelineSchema = z.object({
  id: uuid(),
  tenant_id: uuid(),
  name: z.string(),
  slug: z.string(),
  is_default: z.boolean(),
  stages: z.array(PipelineStageSchema),
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
  entry_criteria: nullable(z.array(z.unknown())).optional(),
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

// ── Users (cleanup wave: GET /v1/users + /v1/auth/me) ──────────────────────

/**
 * `UserListItem` — payload slim emitido por `GET /v1/users`. Para owner
 * pickers y dropdowns de asignación.
 */
export const UserListItemSchema = z.object({
  id: uuid(),
  email: z.string(),
  name: nullable(z.string()).optional(),
  role: UserRoleSchema,
});
export type UserListItem = z.infer<typeof UserListItemSchema>;

export const UserListPageSchema = z.object({
  items: z.array(UserListItemSchema),
  total: z.number().int().min(0),
  limit: z.number().int().min(1).max(200),
  offset: z.number().int().min(0),
});
export type UserListPage = z.infer<typeof UserListPageSchema>;

/**
 * `MeOut` — respuesta de `GET /v1/auth/me`. Extiende UserOut con el
 * `default_pipeline_id` del tenant para evitar una segunda llamada a
 * `/v1/pipelines` cuando el frontend hidrata el form de crear lead.
 */
export const MeOutSchema = z.object({
  id: uuid(),
  tenant_id: uuid(),
  clerk_user_id: z.string(),
  email: z.string(),
  name: nullable(z.string()).optional(),
  first_name: nullable(z.string()).optional(),
  last_name: nullable(z.string()).optional(),
  image_url: nullable(z.string()).optional(),
  role: UserRoleSchema,
  last_seen_at: nullable(dateTime()).optional(),
  default_pipeline_id: nullable(uuid()).optional(),
  created_at: dateTime(),
});
export type MeOut = z.infer<typeof MeOutSchema>;

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

// ── CUPS (Sprint 3) ─────────────────────────────────────────────────────────

export const CupsStatusSchema = z.enum(["draft", "active", "switching", "inactive"]);
export const CupsCountrySchema = z.enum(["ES", "PT"]);
export const EnergyTypeSchema = z.enum(["electricity", "gas"]);

/** Espejo de `components["schemas"]["CupsOut"]`. */
export const CupsSchema = z.object({
  id: uuid(),
  tenant_id: uuid(),
  code: z.string(),
  lead_id: nullable(uuid()),
  country: CupsCountrySchema,
  energy_type: EnergyTypeSchema,
  address: nullable(z.string()),
  city: nullable(z.string()),
  postal_code: nullable(z.string()),
  province: nullable(z.string()),
  distributor_code: nullable(z.string()),
  distributor_name: nullable(z.string()),
  tariff_access_code: nullable(z.string()),
  power_p1_kw: nullable(z.string()),
  power_p2_kw: nullable(z.string()),
  power_p3_kw: nullable(z.string()),
  power_p4_kw: nullable(z.string()),
  power_p5_kw: nullable(z.string()),
  power_p6_kw: nullable(z.string()),
  status: CupsStatusSchema,
  sips_fetched_at: nullable(dateTime()),
  created_at: dateTime(),
  updated_at: dateTime(),
});
export type Cups = z.infer<typeof CupsSchema>;

export const CupsPageSchema = z.object({
  items: z.array(CupsSchema),
  total: z.number().int().min(0),
  limit: z.number().int().min(1).max(200),
  offset: z.number().int().min(0),
});
export type CupsPage = z.infer<typeof CupsPageSchema>;

export const CupsCreateSchema = z.object({
  code: z.string().min(20).max(22),
  lead_id: uuid().nullish(),
  energy_type: EnergyTypeSchema.optional(),
  address: z.string().nullish(),
  city: z.string().nullish(),
  postal_code: z.string().nullish(),
  province: z.string().nullish(),
  distributor_code: z.string().nullish(),
  distributor_name: z.string().nullish(),
  tariff_access_code: z.string().nullish(),
  power_p1_kw: z.number().nullish(),
  power_p2_kw: z.number().nullish(),
  power_p3_kw: z.number().nullish(),
  power_p4_kw: z.number().nullish(),
  power_p5_kw: z.number().nullish(),
  power_p6_kw: z.number().nullish(),
});
export type CupsCreate = z.infer<typeof CupsCreateSchema>;

export const CupsUpdateSchema = z.object({
  lead_id: uuid().nullish(),
  energy_type: EnergyTypeSchema.nullish(),
  address: z.string().nullish(),
  city: z.string().nullish(),
  postal_code: z.string().nullish(),
  province: z.string().nullish(),
  distributor_code: z.string().nullish(),
  distributor_name: z.string().nullish(),
  tariff_access_code: z.string().nullish(),
  power_p1_kw: z.number().nullish(),
  power_p2_kw: z.number().nullish(),
  power_p3_kw: z.number().nullish(),
  power_p4_kw: z.number().nullish(),
  power_p5_kw: z.number().nullish(),
  power_p6_kw: z.number().nullish(),
  status: CupsStatusSchema.nullish(),
});
export type CupsUpdate = z.infer<typeof CupsUpdateSchema>;

/** SIPS data returned by `GET /v1/cups/{code}/sips`. */
export const SipsResponseSchema = z.object({
  code: z.string(),
  cached: z.boolean(),
  distributor_code: nullable(z.string()).optional(),
  distributor_name: nullable(z.string()).optional(),
  tariff_access_code: nullable(z.string()).optional(),
  address: nullable(z.string()).optional(),
  city: nullable(z.string()).optional(),
  postal_code: nullable(z.string()).optional(),
  province: nullable(z.string()).optional(),
  consumption_12m_kwh: nullable(z.string()).optional(),
  contracted_power_kw: z.record(z.string(), z.unknown()).nullish(),
  fetched_at: nullable(z.string()).optional(),
  raw: z.record(z.string(), z.unknown()).nullish(),
});
export type SipsResponse = z.infer<typeof SipsResponseSchema>;

// ── Products (Sprint 3) ─────────────────────────────────────────────────────

export const ProductStatusSchema = z.enum(["draft", "active", "retired"]);
export const TariffKindSchema = z.enum(["fixed", "indexed_omie", "multi_period"]);

export const ProductSchema = z.object({
  id: uuid(),
  tenant_id: uuid(),
  code: z.string(),
  name: z.string(),
  energy_type: EnergyTypeSchema,
  tariff_kind: TariffKindSchema,
  term_months: z.number().int(),
  currency: z.string(),
  pricing: z.record(z.string(), z.unknown()),
  notes: nullable(z.string()),
  status: ProductStatusSchema,
  created_at: dateTime(),
  updated_at: dateTime(),
});
export type Product = z.infer<typeof ProductSchema>;

export const ProductPageSchema = z.object({
  items: z.array(ProductSchema),
  total: z.number().int().min(0),
  limit: z.number().int().min(1).max(200),
  offset: z.number().int().min(0),
});
export type ProductPage = z.infer<typeof ProductPageSchema>;

export const ProductCreateSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(64),
  energy_type: EnergyTypeSchema.optional(),
  tariff_kind: TariffKindSchema.optional(),
  term_months: z.number().int().min(1).optional(),
  currency: z.string().length(3).optional(),
  pricing: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().nullish(),
});
export type ProductCreate = z.infer<typeof ProductCreateSchema>;

export const ProductUpdateSchema = z.object({
  name: z.string().min(1).max(255).nullish(),
  energy_type: EnergyTypeSchema.nullish(),
  tariff_kind: TariffKindSchema.nullish(),
  term_months: z.number().int().min(1).nullish(),
  currency: z.string().length(3).nullish(),
  pricing: z.record(z.string(), z.unknown()).nullish(),
  notes: z.string().nullish(),
  status: ProductStatusSchema.nullish(),
});
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;

// ── Contracts (Sprint 3) ────────────────────────────────────────────────────

export const ContractStatusSchema = z.enum([
  "draft",
  "signed",
  "sent_to_dso",
  "active",
  "rejected",
  "cancelled",
]);

export const ContractSchema = z.object({
  id: uuid(),
  tenant_id: uuid(),
  lead_id: uuid(),
  cups_id: uuid(),
  product_id: uuid(),
  number: z.string(),
  customer_name: z.string(),
  customer_tax_id: z.string(),
  customer_email: nullable(z.string()),
  customer_phone_e164: nullable(z.string()),
  billing_address: nullable(z.string()),
  status: ContractStatusSchema,
  start_date: nullable(z.string()),
  term_months: z.number().int(),
  currency: z.string(),
  extra: z.record(z.string(), z.unknown()),
  pdf_storage_key: nullable(z.string()),
  pdf_storage_bucket: nullable(z.string()),
  pdf_sha256: nullable(z.string()),
  pdf_generated_at: nullable(dateTime()),
  signature_provider: nullable(z.string()),
  signature_provider_id: nullable(z.string()),
  signature_requested_at: nullable(dateTime()),
  signed_at: nullable(dateTime()),
  sent_to_dso_at: nullable(dateTime()),
  activated_at: nullable(dateTime()),
  cancelled_at: nullable(dateTime()),
  rejected_at: nullable(dateTime()),
  rejection_reason: nullable(z.string()),
  created_at: dateTime(),
  updated_at: dateTime(),
});
export type Contract = z.infer<typeof ContractSchema>;

export const ContractPageSchema = z.object({
  items: z.array(ContractSchema),
  total: z.number().int().min(0),
  limit: z.number().int().min(1).max(200),
  offset: z.number().int().min(0),
});
export type ContractPage = z.infer<typeof ContractPageSchema>;

export const ContractCreateSchema = z.object({
  lead_id: uuid(),
  cups_id: uuid(),
  product_id: uuid(),
  customer_name: z.string().min(1).max(255),
  customer_tax_id: z.string().min(1).max(20),
  customer_email: z.string().email().nullish(),
  customer_phone_e164: phoneE164Schema.nullish(),
  billing_address: z.string().nullish(),
  start_date: z.string().nullish(),
  term_months: z.number().int().min(1).optional(),
  currency: z.string().length(3).optional(),
  extra: z.record(z.string(), z.unknown()).optional(),
});
export type ContractCreate = z.infer<typeof ContractCreateSchema>;

export const ContractUpdateSchema = z.object({
  customer_name: z.string().min(1).max(255).nullish(),
  customer_tax_id: z.string().min(1).max(20).nullish(),
  customer_email: z.string().email().nullish(),
  customer_phone_e164: phoneE164Schema.nullish(),
  billing_address: z.string().nullish(),
  start_date: z.string().nullish(),
  term_months: z.number().int().min(1).nullish(),
  extra: z.record(z.string(), z.unknown()).nullish(),
});
export type ContractUpdate = z.infer<typeof ContractUpdateSchema>;

export const ContractCancelSchema = z.object({
  reason: z.string().nullish(),
});
export type ContractCancel = z.infer<typeof ContractCancelSchema>;

export const ContractSignRequestSchema = z.object({
  recipient_name: z.string().min(1),
  recipient_email: z.string().email(),
  subject: z.string().nullish(),
  body: z.string().nullish(),
});
export type ContractSignRequest = z.infer<typeof ContractSignRequestSchema>;

export const ContractSignResponseSchema = z.object({
  signature_request_id: uuid(),
  provider: z.string(),
  provider_id: z.string(),
  requested_at: dateTime(),
  contract: ContractSchema,
});
export type ContractSignResponse = z.infer<typeof ContractSignResponseSchema>;

// ── Quotes (Sprint 3) ──────────────────────────────────────────────────────

export const QuoteBaselineInSchema = z.object({
  annual_energy_kwh: z.number().positive(),
  annual_total_eur: z.number().positive(),
  contracted_power_kw: z.number().nullish(),
});
export type QuoteBaselineIn = z.infer<typeof QuoteBaselineInSchema>;

export const QuoteRateInSchema = z.object({
  energy_eur_per_kwh: z.number(),
  power_eur_per_kw_day: z.number().optional(),
  fixed_monthly_eur: z.number().optional(),
});
export type QuoteRateIn = z.infer<typeof QuoteRateInSchema>;

export const QuoteCalculateRequestSchema = z.object({
  baseline: QuoteBaselineInSchema,
  cups_id: uuid().nullish(),
  product_id: uuid().nullish(),
  rate: QuoteRateInSchema.nullish(),
});
export type QuoteCalculateRequest = z.infer<typeof QuoteCalculateRequestSchema>;

export const QuoteCalculateResponseSchema = z.object({
  baseline_eur: z.string(),
  projected_eur: z.string(),
  savings_eur: z.string(),
  savings_pct: z.string(),
  assumptions: z.array(z.string()),
});
export type QuoteCalculateResponse = z.infer<typeof QuoteCalculateResponseSchema>;

// ── Invoice OCR (Sprint 3) ──────────────────────────────────────────────────

export const InvoiceOcrResponseSchema = z.object({
  provider: z.string(),
  model: z.string(),
  cups: nullable(z.string()).optional(),
  tariff_access_code: nullable(z.string()).optional(),
  contracted_power_kw: nullable(z.string()).optional(),
  annual_energy_kwh: nullable(z.string()).optional(),
  annual_total_eur: nullable(z.string()).optional(),
  billing_period_days: nullable(z.number().int()).optional(),
  supplier: nullable(z.string()).optional(),
  input_tokens: z.number().int().optional(),
  output_tokens: z.number().int().optional(),
});
export type InvoiceOcrResponse = z.infer<typeof InvoiceOcrResponseSchema>;

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
type _PipelineCompat = _Assignable<
  components["schemas"]["PipelineOut"],
  Pipeline
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
type _MeOutCompat = _Assignable<components["schemas"]["MeOut"], MeOut>;
type _UserListItemCompat = _Assignable<
  components["schemas"]["UserListItem"],
  UserListItem
>;
type _UserListPageCompat = _Assignable<
  components["schemas"]["UserListPage"],
  UserListPage
>;

// Sprint 3 compatibility checks
type _CupsCompat = _Assignable<components["schemas"]["CupsOut"], Cups>;
type _CupsPageCompat = _Assignable<
  components["schemas"]["Page_CupsOut_"],
  CupsPage
>;
type _ProductCompat = _Assignable<
  components["schemas"]["ProductOut"],
  Product
>;
type _ProductPageCompat = _Assignable<
  components["schemas"]["Page_ProductOut_"],
  ProductPage
>;
type _ContractCompat = _Assignable<
  components["schemas"]["ContractOut"],
  Contract
>;
type _ContractPageCompat = _Assignable<
  components["schemas"]["Page_ContractOut_"],
  ContractPage
>;
type _QuoteResponseCompat = _Assignable<
  components["schemas"]["QuoteCalculateResponse"],
  QuoteCalculateResponse
>;

// Si alguno de estos no es `true`, el typecheck falla en el ensamblado.
const _compatibilityChecks: [
  _LeadCompat,
  _LeadPageCompat,
  _PipelineCompat,
  _PipelineStageCompat,
  _WhatsAppMessageCompat,
  _LeadBulkResultCompat,
  _MeOutCompat,
  _UserListItemCompat,
  _UserListPageCompat,
  _CupsCompat,
  _CupsPageCompat,
  _ProductCompat,
  _ProductPageCompat,
  _ContractCompat,
  _ContractPageCompat,
  _QuoteResponseCompat,
] = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
void _compatibilityChecks;
