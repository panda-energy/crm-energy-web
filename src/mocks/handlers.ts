import { http, HttpResponse } from "msw";
import type { components } from "@/lib/api/types";
import { currentUserFixture, leadsFixture } from "./fixtures/leads";

type Lead = components["schemas"]["Lead"];
type LeadCreate = components["schemas"]["LeadCreate"];
type LeadPage = components["schemas"]["LeadPage"];
type LeadStatus = components["schemas"]["LeadStatus"];

/**
 * Base URL del backend mockeado. En dev usamos un origen relativo `/v1/*`
 * para que MSW intercepte sin importar el host. En tests Node, también.
 *
 * Si el código de fetch usa `NEXT_PUBLIC_API_URL`, MSW también atrapa
 * la URL completa porque registramos handlers absolutos y relativos.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Estado mutable in-memory. Cada reload del worker lo resetea.
const leadsStore: Lead[] = [...leadsFixture];

// Cache de Idempotency-Key → Lead creado, para deduplicar.
const idempotencyCache = new Map<string, Lead>();

function correlationHeaders(): Record<string, string> {
  return { "x-correlation-id": crypto.randomUUID() };
}

function buildLeadPage(items: Lead[], page: number, pageSize: number): LeadPage {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    items: items.slice(start, end),
    total: items.length,
    page,
    pageSize,
  };
}

const meHandler = http.get(`${API_BASE}/v1/auth/me`, () =>
  HttpResponse.json(currentUserFixture, { headers: correlationHeaders() }),
);

const listLeadsHandler = http.get(`${API_BASE}/v1/leads`, ({ request }) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? 1);
  const pageSize = Number(url.searchParams.get("pageSize") ?? 25);
  const statusFilter = url.searchParams.get("status") as LeadStatus | null;

  const filtered = statusFilter
    ? leadsStore.filter((l) => l.status === statusFilter)
    : leadsStore;

  return HttpResponse.json(buildLeadPage(filtered, page, pageSize), {
    headers: correlationHeaders(),
  });
});

const getLeadHandler = http.get(`${API_BASE}/v1/leads/:leadId`, ({ params }) => {
  const { leadId } = params;
  const lead = leadsStore.find((l) => l.id === leadId);
  if (!lead) {
    return HttpResponse.json(
      {
        type: "about:blank",
        title: "Lead no encontrado",
        status: 404,
        detail: `No existe lead con id ${String(leadId)}`,
      },
      { status: 404, headers: correlationHeaders() },
    );
  }
  return HttpResponse.json(lead, { headers: correlationHeaders() });
});

const createLeadHandler = http.post(`${API_BASE}/v1/leads`, async ({ request }) => {
  const idemKey = request.headers.get("Idempotency-Key");
  if (idemKey && idempotencyCache.has(idemKey)) {
    const cached = idempotencyCache.get(idemKey);
    if (cached) {
      return HttpResponse.json(cached, { status: 201, headers: correlationHeaders() });
    }
  }

  const body = (await request.json()) as LeadCreate;
  const now = new Date().toISOString();
  const newLead: Lead = {
    id: crypto.randomUUID(),
    tenantId: currentUserFixture.tenantId,
    name: body.name,
    email: body.email,
    phone: body.phone,
    status: body.status,
    source: body.source,
    ownerId: currentUserFixture.id,
    createdAt: now,
    updatedAt: now,
  };
  leadsStore.unshift(newLead);
  if (idemKey) idempotencyCache.set(idemKey, newLead);

  return HttpResponse.json(newLead, { status: 201, headers: correlationHeaders() });
});

export const handlers = [meHandler, listLeadsHandler, getLeadHandler, createLeadHandler];
