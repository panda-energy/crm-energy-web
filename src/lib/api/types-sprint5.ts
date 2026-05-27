/**
 * Sprint 5 manual types -- AI Chat, Channels/Commissions, Portal Cliente.
 *
 * These types anticipate the backend Sprint 5. Since the backend endpoints
 * do NOT exist yet in the OpenAPI schema, we define manual types here.
 * Once the backend implements them and we run `pnpm gen:types`, these
 * should be replaced by imports from `types.ts`.
 *
 * DO NOT import from `./types.ts` -- these are standalone.
 */

// -- AI Chat -----------------------------------------------------------------

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: "pending_approval" | "approved" | "rejected" | "executed" | "failed";
  result?: string;
}

export type ToolCallStatus = ToolCall["status"];

export interface ChatMessageContext {
  page: string;
  entity_type?: string;
  entity_id?: string;
}

export type ChatMessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  created_at: string;
  context?: ChatMessageContext;
  tool_calls?: ToolCall[];
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface ChatSendRequest {
  content: string;
  context?: ChatMessageContext;
}

export interface AiSuggestionRequest {
  context: string;
  field: string;
}

export interface AiSuggestion {
  field: string;
  value: string;
  explanation: string;
}

// -- Channels / Commissions --------------------------------------------------

export type ChannelType = "direct" | "agency" | "partner" | "online";

export interface Channel {
  id: string;
  tenant_id: string;
  name: string;
  type: ChannelType;
  parent_id: string | null;
  commission_rate_pct: number;
  active: boolean;
  agents_count: number;
  created_at: string;
}

export type CommissionStatus = "pending" | "approved" | "paid" | "cancelled";

export interface Commission {
  id: string;
  tenant_id: string;
  channel_id: string;
  agent_user_id: string;
  contract_id: string;
  amount_cents: number;
  currency: string;
  status: CommissionStatus;
  period: string;
  approved_at: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface CommissionPage {
  items: Commission[];
  total: number;
  limit: number;
  offset: number;
}

export interface CommissionSummary {
  total_pending_cents: number;
  total_approved_cents: number;
  total_paid_cents: number;
  current_month_cents: number;
  target_cents: number | null;
  contracts_count: number;
}

// -- Portal Cliente ----------------------------------------------------------

export interface CustomerConsumption {
  period: string;
  energy_kwh: number;
  amount_cents: number;
  currency: string;
}

export type InvoiceStatus = "pending" | "paid" | "overdue";

export interface CustomerInvoice {
  id: string;
  invoice_number: string;
  period: string;
  amount_cents: number;
  currency: string;
  status: InvoiceStatus;
  pdf_url: string | null;
  issued_at: string;
  due_at: string;
}

export interface InvoicePage {
  items: CustomerInvoice[];
  total: number;
  limit: number;
  offset: number;
}

export type PowerRequestStatus =
  | "pending"
  | "sent_to_dso"
  | "approved"
  | "rejected";

export interface PowerModificationRequest {
  id: string;
  contract_id: string;
  cups_code: string;
  current_power_kw: number[];
  requested_power_kw: number[];
  status: PowerRequestStatus;
  created_at: string;
}

export interface PowerModificationCreate {
  contract_id: string;
  cups_code: string;
  requested_power_kw: number[];
}
