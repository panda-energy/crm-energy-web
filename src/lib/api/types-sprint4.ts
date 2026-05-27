/**
 * Sprint 4 manual types — ATR messages + Tickets.
 *
 * These types anticipate the backend Sprint 4 (ATR regulatorio). Since the
 * backend endpoints do NOT exist yet in the OpenAPI schema, we define manual
 * types here. Once the backend implements them and we run `pnpm gen:types`,
 * these should be replaced by imports from `types.ts` and compatibility
 * checks added to `zod-schemas.ts`.
 *
 * DO NOT import from `./types.ts` — these are standalone.
 */

// ── ATR Message ─────────────────────────────────────────────────────────────

export type AtrMessageType = "C1" | "A3" | "B1" | "M1" | "R1";

export type AtrMessageStatus =
  | "pending"
  | "sent"
  | "ack_received"
  | "processed"
  | "rejected"
  | "timeout";

export type AtrDistributor =
  | "e-distribucion"
  | "i-de"
  | "ufd"
  | "viesgo"
  | "begasa";

export interface AtrMessage {
  id: string;
  tenant_id: string;
  contract_id: string;
  cups_code: string;
  message_type: AtrMessageType;
  status: AtrMessageStatus;
  distributor: AtrDistributor;
  external_id: string | null;
  retry_count: number;
  max_retries: number;
  last_error: string | null;
  xml_storage_key: string | null;
  xsd_version: string;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  ack_at: string | null;
  processed_at: string | null;
}

export interface AtrMessagePage {
  items: AtrMessage[];
  total: number;
  limit: number;
  offset: number;
}

// ── Tickets ─────────────────────────────────────────────────────────────────

export type TicketChannel = "whatsapp" | "email" | "chat" | "phone";

export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting_customer"
  | "resolved"
  | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface Ticket {
  id: string;
  tenant_id: string;
  lead_id: string | null;
  contract_id: string | null;
  subject: string;
  channel: TicketChannel;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to: string | null;
  sla_deadline: string | null;
  sla_breached: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
}

export interface TicketCreate {
  subject: string;
  channel: TicketChannel;
  priority?: TicketPriority;
  lead_id?: string | null;
  contract_id?: string | null;
  assigned_to?: string | null;
  tags?: string[];
  body?: string;
}

export interface TicketUpdate {
  subject?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigned_to?: string | null;
  tags?: string[];
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: "agent" | "customer" | "system";
  sender_id: string | null;
  body: string;
  channel: TicketChannel;
  created_at: string;
}

export interface TicketMessageCreate {
  body: string;
  sender_type?: "agent" | "customer" | "system";
}

export interface TicketPage {
  items: Ticket[];
  total: number;
  limit: number;
  offset: number;
}
