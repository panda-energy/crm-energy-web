/**
 * Zod schemas for Sprint 4 types — ATR messages + Tickets.
 *
 * Separate file because these types do NOT come from the OpenAPI-generated
 * `types.ts` (the backend endpoints don't exist yet). Once the backend
 * Sprint 4 ships, move these schemas into `zod-schemas.ts` and add
 * compatibility checks.
 */
import { z } from "zod";

// ── Helpers ─────────────────────────────────────────────────────────────────

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuid = () => z.string().regex(UUID_RE, { message: "Invalid UUID" });
const nullable = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.null()]);

// ── ATR Enums ───────────────────────────────────────────────────────────────

export const AtrMessageTypeSchema = z.enum(["C1", "A3", "B1", "M1", "R1"]);

export const AtrMessageStatusSchema = z.enum([
  "pending",
  "sent",
  "ack_received",
  "processed",
  "rejected",
  "timeout",
]);

export const AtrDistributorSchema = z.enum([
  "e-distribucion",
  "i-de",
  "ufd",
  "viesgo",
  "begasa",
]);

// ── ATR Message ─────────────────────────────────────────────────────────────

export const AtrMessageSchema = z.object({
  id: uuid(),
  tenant_id: uuid(),
  contract_id: uuid(),
  cups_code: z.string(),
  message_type: AtrMessageTypeSchema,
  status: AtrMessageStatusSchema,
  distributor: AtrDistributorSchema,
  external_id: nullable(z.string()),
  retry_count: z.number().int().min(0),
  max_retries: z.number().int().min(0),
  last_error: nullable(z.string()),
  xml_storage_key: nullable(z.string()),
  xsd_version: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  sent_at: nullable(z.string()),
  ack_at: nullable(z.string()),
  processed_at: nullable(z.string()),
});

export const AtrMessagePageSchema = z.object({
  items: z.array(AtrMessageSchema),
  total: z.number().int().min(0),
  limit: z.number().int().min(1).max(200),
  offset: z.number().int().min(0),
});

// ── Ticket Enums ────────────────────────────────────────────────────────────

export const TicketChannelSchema = z.enum([
  "whatsapp",
  "email",
  "chat",
  "phone",
]);

export const TicketStatusSchema = z.enum([
  "open",
  "in_progress",
  "waiting_customer",
  "resolved",
  "closed",
]);

export const TicketPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "urgent",
]);

// ── Ticket ──────────────────────────────────────────────────────────────────

export const TicketSchema = z.object({
  id: uuid(),
  tenant_id: uuid(),
  lead_id: nullable(uuid()),
  contract_id: nullable(uuid()),
  subject: z.string(),
  channel: TicketChannelSchema,
  status: TicketStatusSchema,
  priority: TicketPrioritySchema,
  assigned_to: nullable(uuid()),
  sla_deadline: nullable(z.string()),
  sla_breached: z.boolean(),
  tags: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
  resolved_at: nullable(z.string()),
  closed_at: nullable(z.string()),
});

export const TicketPageSchema = z.object({
  items: z.array(TicketSchema),
  total: z.number().int().min(0),
  limit: z.number().int().min(1).max(200),
  offset: z.number().int().min(0),
});

// ── Ticket Message ──────────────────────────────────────────────────────────

export const TicketMessageSchema = z.object({
  id: uuid(),
  ticket_id: uuid(),
  sender_type: z.enum(["agent", "customer", "system"]),
  sender_id: nullable(uuid()),
  body: z.string(),
  channel: TicketChannelSchema,
  created_at: z.string(),
});
