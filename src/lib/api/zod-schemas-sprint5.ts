/**
 * Zod schemas for Sprint 5 types -- AI Chat, Channels/Commissions, Portal.
 *
 * Separate file because these types do NOT come from the OpenAPI-generated
 * `types.ts` (the backend endpoints don't exist yet).
 */
import { z } from "zod";

// -- Helpers -----------------------------------------------------------------

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuid = () => z.string().regex(UUID_RE, { message: "Invalid UUID" });
const nullable = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.null()]);

// -- AI Chat -----------------------------------------------------------------

export const ToolCallStatusSchema = z.enum([
  "pending_approval",
  "approved",
  "rejected",
  "executed",
  "failed",
]);

export const ToolCallSchema = z.object({
  id: uuid(),
  name: z.string(),
  arguments: z.record(z.string(), z.unknown()),
  status: ToolCallStatusSchema,
  result: z.string().optional(),
});

export const ChatMessageContextSchema = z.object({
  page: z.string(),
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
});

export const ChatMessageRoleSchema = z.enum(["user", "assistant", "system"]);

export const ChatMessageSchema = z.object({
  id: uuid(),
  role: ChatMessageRoleSchema,
  content: z.string(),
  created_at: z.string(),
  context: ChatMessageContextSchema.optional(),
  tool_calls: z.array(ToolCallSchema).optional(),
});

export const ChatSessionSchema = z.object({
  id: uuid(),
  messages: z.array(ChatMessageSchema),
  created_at: z.string(),
  updated_at: z.string(),
});

export const AiSuggestionSchema = z.object({
  field: z.string(),
  value: z.string(),
  explanation: z.string(),
});

// -- Channels / Commissions --------------------------------------------------

export const ChannelTypeSchema = z.enum([
  "direct",
  "agency",
  "partner",
  "online",
]);

export const ChannelSchema = z.object({
  id: uuid(),
  tenant_id: uuid(),
  name: z.string(),
  type: ChannelTypeSchema,
  parent_id: nullable(uuid()),
  commission_rate_pct: z.number(),
  active: z.boolean(),
  agents_count: z.number().int().min(0),
  created_at: z.string(),
});

export const CommissionStatusSchema = z.enum([
  "pending",
  "approved",
  "paid",
  "cancelled",
]);

export const CommissionSchema = z.object({
  id: uuid(),
  tenant_id: uuid(),
  channel_id: uuid(),
  agent_user_id: uuid(),
  contract_id: uuid(),
  amount_cents: z.number().int(),
  currency: z.string(),
  status: CommissionStatusSchema,
  period: z.string(),
  approved_at: nullable(z.string()),
  paid_at: nullable(z.string()),
  created_at: z.string(),
});

export const CommissionPageSchema = z.object({
  items: z.array(CommissionSchema),
  total: z.number().int().min(0),
  limit: z.number().int().min(1).max(200),
  offset: z.number().int().min(0),
});

export const CommissionSummarySchema = z.object({
  total_pending_cents: z.number().int(),
  total_approved_cents: z.number().int(),
  total_paid_cents: z.number().int(),
  current_month_cents: z.number().int(),
  target_cents: nullable(z.number().int()),
  contracts_count: z.number().int().min(0),
});

// -- Portal Cliente ----------------------------------------------------------

export const CustomerConsumptionSchema = z.object({
  period: z.string(),
  energy_kwh: z.number(),
  amount_cents: z.number().int(),
  currency: z.string(),
});

export const InvoiceStatusSchema = z.enum(["pending", "paid", "overdue"]);

export const CustomerInvoiceSchema = z.object({
  id: uuid(),
  invoice_number: z.string(),
  period: z.string(),
  amount_cents: z.number().int(),
  currency: z.string(),
  status: InvoiceStatusSchema,
  pdf_url: nullable(z.string()),
  issued_at: z.string(),
  due_at: z.string(),
});

export const InvoicePageSchema = z.object({
  items: z.array(CustomerInvoiceSchema),
  total: z.number().int().min(0),
  limit: z.number().int().min(1).max(200),
  offset: z.number().int().min(0),
});

export const PowerRequestStatusSchema = z.enum([
  "pending",
  "sent_to_dso",
  "approved",
  "rejected",
]);

export const PowerModificationRequestSchema = z.object({
  id: uuid(),
  contract_id: uuid(),
  cups_code: z.string(),
  current_power_kw: z.array(z.number()),
  requested_power_kw: z.array(z.number()),
  status: PowerRequestStatusSchema,
  created_at: z.string(),
});

export const PowerModificationCreateSchema = z.object({
  contract_id: uuid(),
  cups_code: z.string(),
  requested_power_kw: z
    .array(z.number().positive({ message: "Potencia debe ser > 0" }))
    .min(1)
    .max(6),
});
