import { http, HttpResponse } from "msw";
import type {
  ChatMessage,
  ChatSendRequest,
  Channel,
  Commission,
  CommissionStatus,
  CustomerConsumption,
  CustomerInvoice,
  InvoiceStatus,
  PowerModificationRequest,
  PowerModificationCreate,
  AiSuggestionRequest,
} from "@/lib/api/types-sprint5";
import {
  CHAT_SESSION_FIXTURE,
  CHAT_MESSAGES,
  CHANNEL_FIXTURES,
  COMMISSION_FIXTURES,
  COMMISSION_SUMMARY_FIXTURE,
  CONSUMPTION_FIXTURES,
  INVOICE_FIXTURES,
  POWER_REQUEST_FIXTURES,
} from "./fixtures/sprint5";
import { TENANT_ID } from "./fixtures/pipelines";
import { USER_IDS } from "./fixtures/users";
import { CONTRACT_IDS } from "./fixtures/contracts";

/**
 * MSW handlers for Sprint 5 endpoints: AI Chat, Channels/Commissions, Portal.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// In-memory stores
const chatMessagesStore: ChatMessage[] = [...CHAT_MESSAGES];
const channelsStore: Channel[] = [...CHANNEL_FIXTURES];
const commissionsStore: Commission[] = [...COMMISSION_FIXTURES];
const consumptionStore: CustomerConsumption[] = [...CONSUMPTION_FIXTURES];
const invoicesStore: CustomerInvoice[] = [...INVOICE_FIXTURES];
const powerRequestsStore: PowerModificationRequest[] = [
  ...POWER_REQUEST_FIXTURES,
];

// -- Helpers -----------------------------------------------------------------

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

// reason: same as other handlers -- DTO to Record<string, unknown>
function asJson<T>(value: T): Record<string, unknown> {
  return value as unknown as Record<string, unknown>;
}

// -- AI Chat Handlers --------------------------------------------------------

const getChatSessionHandler = http.get(
  `${API_BASE}/v1/ai/chat`,
  () => {
    const session = {
      ...CHAT_SESSION_FIXTURE,
      messages: chatMessagesStore,
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json(asJson(session), {
      headers: correlationHeaders(),
    });
  },
);

const sendChatMessageHandler = http.post(
  `${API_BASE}/v1/ai/chat`,
  async ({ request }) => {
    const body = (await request.json()) as ChatSendRequest;
    const now = new Date().toISOString();

    // Add user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: body.content,
      created_at: now,
      context: body.context,
    };
    chatMessagesStore.push(userMsg);

    // Generate mock assistant response
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: generateMockResponse(body.content),
      created_at: new Date(Date.now() + 1000).toISOString(),
      tool_calls: maybeGenerateToolCall(body.content),
    };
    chatMessagesStore.push(assistantMsg);

    return HttpResponse.json(asJson(assistantMsg), {
      status: 201,
      headers: correlationHeaders(),
    });
  },
);

function generateMockResponse(userContent: string): string {
  const lower = userContent.toLowerCase();
  if (lower.includes("lead") || lower.includes("cliente")) {
    return "He analizado tu base de datos. Actualmente tienes **24 leads activos** en el pipeline. El 60% estan en la fase de contacto inicial. Te recomiendo priorizar los 3 leads que llevan mas de 5 dias sin actividad.";
  }
  if (lower.includes("contrato") || lower.includes("contract")) {
    return "Tienes **8 contratos** en total: 3 firmados, 2 en borrador, 2 enviados para firma, y 1 cancelado. El valor total de contratos activos es de **45.200 EUR**.";
  }
  if (lower.includes("atr") || lower.includes("distribuidor")) {
    return "Hay **3 mensajes ATR pendientes** de respuesta:\n\n1. C1 Alta - ES0021... (e-distribucion) - 2 dias\n2. M1 Modificacion - ES0031... (i-de) - 4 dias\n3. B1 Baja - ES0041... (ufd) - 1 dia\n\nEl mensaje #2 esta cerca del timeout de 5 dias laborables.";
  }
  if (lower.includes("comisi") || lower.includes("commission")) {
    return "Tu resumen de comisiones de mayo:\n\n- **Pendientes:** 1.250 EUR (5 contratos)\n- **Aprobadas:** 690 EUR (3 contratos)\n- **Pagadas este mes:** 0 EUR\n\nVas al **62,5%** de tu objetivo mensual de 2.000 EUR.";
  }
  return "Entendido. He procesado tu consulta. Puedo ayudarte con leads, contratos, mensajes ATR, comisiones, o cualquier otra gestion del CRM. Dime que necesitas.";
}

function maybeGenerateToolCall(
  userContent: string,
): ChatMessage["tool_calls"] {
  const lower = userContent.toLowerCase();
  if (lower.includes("crea") && lower.includes("lead")) {
    return [
      {
        id: crypto.randomUUID(),
        name: "create_lead",
        arguments: { first_name: "Demo", last_name: "Lead", source: "manual" },
        status: "pending_approval",
      },
    ];
  }
  if (lower.includes("envia") && lower.includes("atr")) {
    return [
      {
        id: crypto.randomUUID(),
        name: "send_atr",
        arguments: {
          message_type: "C1",
          contract_id: CONTRACT_IDS.ct1,
          distributor: "e-distribucion",
        },
        status: "pending_approval",
      },
    ];
  }
  return undefined;
}

const approveToolCallHandler = http.post(
  `${API_BASE}/v1/ai/tool-calls/:toolCallId/approve`,
  ({ params }) => {
    const toolCallId = String(params.toolCallId);
    // Find and update the tool call in messages
    for (const msg of chatMessagesStore) {
      if (!msg.tool_calls) continue;
      const tc = msg.tool_calls.find((t) => t.id === toolCallId);
      if (tc) {
        tc.status = "executed";
        tc.result = "Accion ejecutada correctamente.";
        return HttpResponse.json(asJson(tc), {
          headers: correlationHeaders(),
        });
      }
    }
    return problemResponse(404, "Tool call no encontrado");
  },
);

const rejectToolCallHandler = http.post(
  `${API_BASE}/v1/ai/tool-calls/:toolCallId/reject`,
  ({ params }) => {
    const toolCallId = String(params.toolCallId);
    for (const msg of chatMessagesStore) {
      if (!msg.tool_calls) continue;
      const tc = msg.tool_calls.find((t) => t.id === toolCallId);
      if (tc) {
        tc.status = "rejected";
        return HttpResponse.json(asJson(tc), {
          headers: correlationHeaders(),
        });
      }
    }
    return problemResponse(404, "Tool call no encontrado");
  },
);

const aiSuggestionsHandler = http.post(
  `${API_BASE}/v1/ai/suggestions`,
  async ({ request }) => {
    const body = (await request.json()) as AiSuggestionRequest;
    // Return contextual suggestions based on field
    const suggestions: Record<string, { value: string; explanation: string }> = {
      power: {
        value: "5.75",
        explanation:
          "Potencia optima recomendada: 5.75 kW basado en consumo SIPS",
      },
      product: {
        value: "Tarifa Fija Hogar 2.0TD",
        explanation:
          "Tarifa con mejor relacion calidad-precio para este perfil de consumo",
      },
      cups: {
        value: "",
        explanation: "Este CUPS ya tiene un contrato activo con competencia",
      },
    };
    const match = suggestions[body.field] ?? {
      value: "auto",
      explanation: `Sugerencia automatica para ${body.field}`,
    };
    return HttpResponse.json(
      {
        field: body.field,
        value: match.value,
        explanation: match.explanation,
      },
      { headers: correlationHeaders() },
    );
  },
);

// -- Channels Handlers -------------------------------------------------------

const listChannelsHandler = http.get(
  `${API_BASE}/v1/channels`,
  () => {
    return HttpResponse.json(channelsStore.map(asJson), {
      headers: correlationHeaders(),
    });
  },
);

const getChannelHandler = http.get(
  `${API_BASE}/v1/channels/:channelId`,
  ({ params }) => {
    const channel = channelsStore.find((c) => c.id === params.channelId);
    if (!channel) return problemResponse(404, "Canal no encontrado");
    return HttpResponse.json(asJson(channel), {
      headers: correlationHeaders(),
    });
  },
);

// -- Commissions Handlers ----------------------------------------------------

const listCommissionsHandler = http.get(
  `${API_BASE}/v1/commissions`,
  ({ request }) => {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
    const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

    let filtered = [...commissionsStore];

    const channelId = url.searchParams.get("channel_id");
    if (channelId) {
      filtered = filtered.filter((c) => c.channel_id === channelId);
    }

    const statuses = url.searchParams.get("status");
    if (statuses) {
      const statusList = statuses.split(",") as CommissionStatus[];
      filtered = filtered.filter((c) => statusList.includes(c.status));
    }

    const period = url.searchParams.get("period");
    if (period) {
      filtered = filtered.filter((c) => c.period === period);
    }

    const agentUserId = url.searchParams.get("agent_user_id");
    if (agentUserId) {
      filtered = filtered.filter((c) => c.agent_user_id === agentUserId);
    }

    // Sort by created_at desc
    filtered.sort((a, b) => (a.created_at > b.created_at ? -1 : 1));

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

const getCommissionSummaryHandler = http.get(
  `${API_BASE}/v1/commissions/summary`,
  () => {
    return HttpResponse.json(asJson(COMMISSION_SUMMARY_FIXTURE), {
      headers: correlationHeaders(),
    });
  },
);

// -- Portal Handlers ---------------------------------------------------------

const getPortalConsumptionHandler = http.get(
  `${API_BASE}/v1/portal/consumption`,
  ({ request }) => {
    const url = new URL(request.url);
    const year = url.searchParams.get("year");
    let data = [...consumptionStore];
    if (year) {
      data = data.filter((c) => c.period.startsWith(year));
    }
    return HttpResponse.json(data.map(asJson), {
      headers: correlationHeaders(),
    });
  },
);

const listPortalInvoicesHandler = http.get(
  `${API_BASE}/v1/portal/invoices`,
  ({ request }) => {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
    const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

    let filtered = [...invoicesStore];

    const year = url.searchParams.get("year");
    if (year) {
      filtered = filtered.filter((i) => i.period.startsWith(year));
    }

    const status = url.searchParams.get("status") as InvoiceStatus | null;
    if (status) {
      filtered = filtered.filter((i) => i.status === status);
    }

    // Sort by issued_at desc
    filtered.sort((a, b) => (a.issued_at > b.issued_at ? -1 : 1));

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

const getInvoicePdfHandler = http.get(
  `${API_BASE}/v1/portal/invoices/:invoiceId/pdf`,
  ({ params }) => {
    const invoice = invoicesStore.find((i) => i.id === params.invoiceId);
    if (!invoice) return problemResponse(404, "Factura no encontrada");

    // Return a minimal PDF-like response for mock
    return new HttpResponse("Mock PDF content", {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
        ...correlationHeaders(),
      },
    });
  },
);

const listPowerRequestsHandler = http.get(
  `${API_BASE}/v1/portal/power-requests`,
  () => {
    return HttpResponse.json(powerRequestsStore.map(asJson), {
      headers: correlationHeaders(),
    });
  },
);

const createPowerRequestHandler = http.post(
  `${API_BASE}/v1/portal/power-requests`,
  async ({ request }) => {
    const body = (await request.json()) as PowerModificationCreate;
    const now = new Date().toISOString();
    const newRequest: PowerModificationRequest = {
      id: crypto.randomUUID(),
      contract_id: body.contract_id,
      cups_code: body.cups_code,
      current_power_kw: [5.75, 5.75],
      requested_power_kw: body.requested_power_kw,
      status: "pending",
      created_at: now,
    };
    powerRequestsStore.unshift(newRequest);
    return HttpResponse.json(asJson(newRequest), {
      status: 201,
      headers: correlationHeaders(),
    });
  },
);

export const sprint5Handlers = [
  // AI Chat
  getChatSessionHandler,
  sendChatMessageHandler,
  approveToolCallHandler,
  rejectToolCallHandler,
  aiSuggestionsHandler,
  // Channels
  listChannelsHandler,
  getChannelHandler,
  // Commissions
  listCommissionsHandler,
  getCommissionSummaryHandler,
  // Portal
  getPortalConsumptionHandler,
  listPortalInvoicesHandler,
  getInvoicePdfHandler,
  listPowerRequestsHandler,
  createPowerRequestHandler,
];
