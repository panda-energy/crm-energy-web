import { http, HttpResponse } from "msw";

/**
 * MSW handlers for Sprint 6 endpoints: tenant settings.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function correlationId(): string {
  return crypto.randomUUID();
}

function correlationHeaders(id = correlationId()): Record<string, string> {
  return { "x-correlation-id": id };
}

// Mutable tenant store
const tenantStore = {
  id: "t_demo_001",
  name: "Panda Energy Demo S.L.",
  tax_id: "B12345678",
  address: "Calle Gran Via 28, 28013 Madrid",
  phone: "+34 911 234 567",
  email: "info@pandaenergy.demo",
  logo_url: null as string | null,
  primary_color: "#2E7D32",
  secondary_color: "#5C6BC0",
  created_at: "2026-01-15T10:00:00Z",
  updated_at: "2026-05-27T12:00:00Z",
};

const getTenantHandler = http.get(
  `${API_BASE}/v1/tenants/current`,
  () => {
    return HttpResponse.json(tenantStore, {
      headers: correlationHeaders(),
    });
  },
);

const updateTenantHandler = http.patch(
  `${API_BASE}/v1/tenants/current`,
  async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    if (body.name !== undefined) tenantStore.name = String(body.name);
    if (body.tax_id !== undefined) tenantStore.tax_id = String(body.tax_id);
    if (body.address !== undefined) tenantStore.address = String(body.address);
    if (body.phone !== undefined) tenantStore.phone = String(body.phone);
    if (body.email !== undefined) tenantStore.email = String(body.email);
    if (body.primary_color !== undefined)
      tenantStore.primary_color = String(body.primary_color);
    if (body.secondary_color !== undefined)
      tenantStore.secondary_color = String(body.secondary_color);
    tenantStore.updated_at = new Date().toISOString();
    return HttpResponse.json(tenantStore, { headers: correlationHeaders() });
  },
);

const uploadLogoHandler = http.post(
  `${API_BASE}/v1/tenants/current/logo`,
  async () => {
    const logoUrl = `https://storage.demo/logos/${crypto.randomUUID()}.png`;
    tenantStore.logo_url = logoUrl;
    tenantStore.updated_at = new Date().toISOString();
    return HttpResponse.json(
      { logo_url: logoUrl },
      { status: 201, headers: correlationHeaders() },
    );
  },
);

export const sprint6Handlers = [
  getTenantHandler,
  updateTenantHandler,
  uploadLogoHandler,
];
