import { http, HttpResponse } from "msw";
import type {
  AtrMessage,
  AtrMessageType,
  AtrMessageStatus,
  AtrDistributor,
  Ticket,
  TicketCreate,
  TicketUpdate,
  TicketMessage,
  TicketMessageCreate,
  TicketStatus,
  TicketChannel,
  TicketPriority,
} from "@/lib/api/types-sprint4";
import { ATR_MESSAGE_FIXTURES } from "./fixtures/atr-messages";
import { TICKET_FIXTURES, TICKET_MESSAGE_FIXTURES } from "./fixtures/tickets";
import { TENANT_ID } from "./fixtures/pipelines";
import { USER_IDS } from "./fixtures/users";

/**
 * MSW handlers for Sprint 4 endpoints: ATR messages + Tickets.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// In-memory stores
const atrStore: AtrMessage[] = [...ATR_MESSAGE_FIXTURES];
const ticketsStore: Ticket[] = [...TICKET_FIXTURES];
const ticketMessagesStore: TicketMessage[] = [...TICKET_MESSAGE_FIXTURES];

// ── Helpers ────────────────────────────────────────────────────────────────

function correlationId(): string {
  return crypto.randomUUID();
}

function correlationHeaders(id = correlationId()): Record<string, string> {
  return { "x-correlation-id": id };
}

function problemResponse(status: number, title: string, detail?: string) {
  const cid = correlationId();
  return HttpResponse.json(
    {
      type: "about:blank",
      title,
      status,
      detail: detail ?? null,
      correlationId: cid,
    },
    {
      status,
      headers: {
        "content-type": "application/problem+json",
        "x-correlation-id": cid,
      },
    },
  );
}

// reason: same as other handlers — DTO to Record<string, unknown>
function asJson<T>(value: T): Record<string, unknown> {
  return value as unknown as Record<string, unknown>;
}

// ── ATR Handlers ──────────────────────────────────────────────────────────

const listAtrHandler = http.get(
  `${API_BASE}/v1/atr/messages`,
  ({ request }) => {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
    const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

    let filtered = [...atrStore];

    const messageTypes = url.searchParams.get("message_type");
    if (messageTypes) {
      const types = messageTypes.split(",") as AtrMessageType[];
      filtered = filtered.filter((m) => types.includes(m.message_type));
    }

    const statuses = url.searchParams.get("status");
    if (statuses) {
      const statusList = statuses.split(",") as AtrMessageStatus[];
      filtered = filtered.filter((m) => statusList.includes(m.status));
    }

    const distributor = url.searchParams.get("distributor") as AtrDistributor | null;
    if (distributor) {
      filtered = filtered.filter((m) => m.distributor === distributor);
    }

    const contractId = url.searchParams.get("contract_id");
    if (contractId) {
      filtered = filtered.filter((m) => m.contract_id === contractId);
    }

    const q = url.searchParams.get("q")?.toLowerCase();
    if (q) {
      filtered = filtered.filter((m) => m.cups_code.toLowerCase().includes(q));
    }

    // Sort by updated_at desc
    filtered.sort((a, b) => (a.updated_at > b.updated_at ? -1 : 1));

    const items = filtered.slice(offset, offset + limit);
    return HttpResponse.json(
      {
        items: items.map(asJson),
        total: filtered.length,
        limit,
        offset,
      },
      { headers: correlationHeaders() },
    );
  },
);

const getAtrHandler = http.get(
  `${API_BASE}/v1/atr/messages/:messageId`,
  ({ params }) => {
    const msg = atrStore.find((m) => m.id === params.messageId);
    if (!msg) return problemResponse(404, "Mensaje ATR no encontrado");
    return HttpResponse.json(asJson(msg), { headers: correlationHeaders() });
  },
);

const retryAtrHandler = http.post(
  `${API_BASE}/v1/atr/messages/:messageId/retry`,
  ({ params }) => {
    const idx = atrStore.findIndex((m) => m.id === params.messageId);
    if (idx < 0) return problemResponse(404, "Mensaje ATR no encontrado");
    const msg = atrStore[idx]!;
    if (msg.status !== "rejected" && msg.status !== "timeout") {
      return problemResponse(
        400,
        "Solo se pueden reintentar mensajes rechazados o con timeout",
      );
    }
    const updated: AtrMessage = {
      ...msg,
      status: "pending",
      retry_count: msg.retry_count + 1,
      last_error: null,
      updated_at: new Date().toISOString(),
    };
    atrStore[idx] = updated;
    return HttpResponse.json(asJson(updated), {
      headers: correlationHeaders(),
    });
  },
);

const getAtrXmlHandler = http.get(
  `${API_BASE}/v1/atr/messages/:messageId/xml`,
  ({ params }) => {
    const msg = atrStore.find((m) => m.id === params.messageId);
    if (!msg) return problemResponse(404, "Mensaje ATR no encontrado");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<MensajeATR xmlns="http://www.cnmc.es/atr/${msg.xsd_version}">
  <Cabecera>
    <CodigoDelProceso>${msg.message_type}</CodigoDelProceso>
    <CodigoDelPaso>01</CodigoDelPaso>
    <CodigoDeSolicitud>${msg.external_id ?? "PENDING"}</CodigoDeSolicitud>
    <SecuencialDeSolicitud>1</SecuencialDeSolicitud>
    <FechaSolicitud>${msg.created_at.split("T")[0]}</FechaSolicitud>
    <CUPS>${msg.cups_code}</CUPS>
  </Cabecera>
  <DatosGenerales>
    <Distribuidor>${msg.distributor}</Distribuidor>
    <Comercializador>R2-0025</Comercializador>
    <TipoModificacion>S</TipoModificacion>
  </DatosGenerales>
  <Cliente>
    <TipoIdentificacion>NIF</TipoIdentificacion>
    <Identificacion>12345678A</Identificacion>
    <NombreCliente>Cliente Demo</NombreCliente>
  </Cliente>
  <Contrato>
    <ContratoID>${msg.contract_id}</ContratoID>
    <TarifaAcceso>2.0TD</TarifaAcceso>
    <PotenciasContratadas>
      <Potencia Periodo="1">5.750</Potencia>
      <Potencia Periodo="2">5.750</Potencia>
    </PotenciasContratadas>
  </Contrato>
</MensajeATR>`;

    return new HttpResponse(xml, {
      status: 200,
      headers: {
        "content-type": "text/xml; charset=utf-8",
        ...correlationHeaders(),
      },
    });
  },
);

// ── Ticket Handlers ─────────────────────────────────────────────────────────

const listTicketsHandler = http.get(
  `${API_BASE}/v1/tickets`,
  ({ request }) => {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
    const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

    let filtered = [...ticketsStore];

    const statuses = url.searchParams.get("status");
    if (statuses) {
      const statusList = statuses.split(",") as TicketStatus[];
      filtered = filtered.filter((t) => statusList.includes(t.status));
    }

    const channels = url.searchParams.get("channel");
    if (channels) {
      const channelList = channels.split(",") as TicketChannel[];
      filtered = filtered.filter((t) => channelList.includes(t.channel));
    }

    const priorities = url.searchParams.get("priority");
    if (priorities) {
      const priorityList = priorities.split(",") as TicketPriority[];
      filtered = filtered.filter((t) => priorityList.includes(t.priority));
    }

    const assignedTo = url.searchParams.get("assigned_to");
    if (assignedTo) {
      filtered = filtered.filter((t) => t.assigned_to === assignedTo);
    }

    const slaBreached = url.searchParams.get("sla_breached");
    if (slaBreached === "true") {
      filtered = filtered.filter((t) => t.sla_breached);
    }

    const q = url.searchParams.get("q")?.toLowerCase();
    if (q) {
      filtered = filtered.filter((t) =>
        t.subject.toLowerCase().includes(q),
      );
    }

    // Sort by updated_at desc
    filtered.sort((a, b) => (a.updated_at > b.updated_at ? -1 : 1));

    const items = filtered.slice(offset, offset + limit);
    return HttpResponse.json(
      {
        items: items.map(asJson),
        total: filtered.length,
        limit,
        offset,
      },
      { headers: correlationHeaders() },
    );
  },
);

const getTicketHandler = http.get(
  `${API_BASE}/v1/tickets/:ticketId`,
  ({ params }) => {
    const ticket = ticketsStore.find((t) => t.id === params.ticketId);
    if (!ticket) return problemResponse(404, "Ticket no encontrado");
    return HttpResponse.json(asJson(ticket), { headers: correlationHeaders() });
  },
);

const createTicketHandler = http.post(
  `${API_BASE}/v1/tickets`,
  async ({ request }) => {
    const body = (await request.json()) as TicketCreate;
    const now = new Date().toISOString();
    const newTicket: Ticket = {
      id: crypto.randomUUID(),
      tenant_id: TENANT_ID,
      lead_id: body.lead_id ?? null,
      contract_id: body.contract_id ?? null,
      subject: body.subject,
      channel: body.channel,
      status: "open",
      priority: body.priority ?? "medium",
      assigned_to: body.assigned_to ?? null,
      sla_deadline: new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString(),
      sla_breached: false,
      tags: body.tags ?? [],
      created_at: now,
      updated_at: now,
      resolved_at: null,
      closed_at: null,
    };
    ticketsStore.unshift(newTicket);

    // Create initial message if body provided
    if (body.body) {
      const msg: TicketMessage = {
        id: crypto.randomUUID(),
        ticket_id: newTicket.id,
        sender_type: "agent",
        sender_id: USER_IDS.carlos,
        body: body.body,
        channel: body.channel,
        created_at: now,
      };
      ticketMessagesStore.push(msg);
    }

    return HttpResponse.json(asJson(newTicket), {
      status: 201,
      headers: correlationHeaders(),
    });
  },
);

const updateTicketHandler = http.patch(
  `${API_BASE}/v1/tickets/:ticketId`,
  async ({ params, request }) => {
    const idx = ticketsStore.findIndex((t) => t.id === params.ticketId);
    if (idx < 0) return problemResponse(404, "Ticket no encontrado");
    const body = (await request.json()) as TicketUpdate;
    const ticket = ticketsStore[idx]!;
    const updated: Ticket = {
      ...ticket,
      subject: body.subject ?? ticket.subject,
      status: body.status ?? ticket.status,
      priority: body.priority ?? ticket.priority,
      assigned_to:
        body.assigned_to !== undefined
          ? body.assigned_to
          : ticket.assigned_to,
      tags: body.tags ?? ticket.tags,
      updated_at: new Date().toISOString(),
    };
    ticketsStore[idx] = updated;
    return HttpResponse.json(asJson(updated), {
      headers: correlationHeaders(),
    });
  },
);

const listTicketMessagesHandler = http.get(
  `${API_BASE}/v1/tickets/:ticketId/messages`,
  ({ params }) => {
    const ticket = ticketsStore.find((t) => t.id === params.ticketId);
    if (!ticket) return problemResponse(404, "Ticket no encontrado");
    const messages = ticketMessagesStore
      .filter((m) => m.ticket_id === ticket.id)
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
    return HttpResponse.json(messages.map(asJson), {
      headers: correlationHeaders(),
    });
  },
);

const sendTicketMessageHandler = http.post(
  `${API_BASE}/v1/tickets/:ticketId/messages`,
  async ({ params, request }) => {
    const idx = ticketsStore.findIndex((t) => t.id === params.ticketId);
    if (idx < 0) return problemResponse(404, "Ticket no encontrado");
    const body = (await request.json()) as TicketMessageCreate;
    const now = new Date().toISOString();
    const ticket = ticketsStore[idx]!;
    const msg: TicketMessage = {
      id: crypto.randomUUID(),
      ticket_id: ticket.id,
      sender_type: body.sender_type ?? "agent",
      sender_id: USER_IDS.carlos,
      body: body.body,
      channel: ticket.channel,
      created_at: now,
    };
    ticketMessagesStore.push(msg);
    // Update ticket timestamp
    ticketsStore[idx] = { ...ticket, updated_at: now };
    return HttpResponse.json(asJson(msg), {
      status: 201,
      headers: correlationHeaders(),
    });
  },
);

const closeTicketHandler = http.post(
  `${API_BASE}/v1/tickets/:ticketId/close`,
  ({ params }) => {
    const idx = ticketsStore.findIndex((t) => t.id === params.ticketId);
    if (idx < 0) return problemResponse(404, "Ticket no encontrado");
    const ticket = ticketsStore[idx]!;
    const now = new Date().toISOString();
    const closed: Ticket = {
      ...ticket,
      status: "closed",
      resolved_at: ticket.resolved_at ?? now,
      closed_at: now,
      updated_at: now,
    };
    ticketsStore[idx] = closed;

    // Add system message
    ticketMessagesStore.push({
      id: crypto.randomUUID(),
      ticket_id: ticket.id,
      sender_type: "system",
      sender_id: null,
      body: "Ticket cerrado por el agente.",
      channel: ticket.channel,
      created_at: now,
    });

    return HttpResponse.json(asJson(closed), {
      headers: correlationHeaders(),
    });
  },
);

export const sprint4Handlers = [
  // ATR
  listAtrHandler,
  getAtrHandler,
  retryAtrHandler,
  getAtrXmlHandler,
  // Tickets
  listTicketsHandler,
  getTicketHandler,
  createTicketHandler,
  updateTicketHandler,
  listTicketMessagesHandler,
  sendTicketMessageHandler,
  closeTicketHandler,
];
