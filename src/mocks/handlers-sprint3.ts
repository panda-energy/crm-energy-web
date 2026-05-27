import { http, HttpResponse } from "msw";
import type { components } from "@/lib/api/types";
import { CUPS_FIXTURES } from "./fixtures/cups";
import { PRODUCT_FIXTURES } from "./fixtures/products";
import { CONTRACT_FIXTURES } from "./fixtures/contracts";
import { TENANT_ID } from "./fixtures/pipelines";

type CupsOut = components["schemas"]["CupsOut"];
type CupsCreate = components["schemas"]["CupsCreate"];
type CupsUpdate = components["schemas"]["CupsUpdate"];
type ProductOut = components["schemas"]["ProductOut"];
type ProductCreate = components["schemas"]["ProductCreate"];
type ContractOut = components["schemas"]["ContractOut"];
type ContractCreate = components["schemas"]["ContractCreate"];
type ContractUpdate = components["schemas"]["ContractUpdate"];
type ContractStatus = components["schemas"]["ContractStatus"];
type QuoteCalculateRequest = components["schemas"]["QuoteCalculateRequest"];
type QuoteCalculateResponse = components["schemas"]["QuoteCalculateResponse"];
type SipsResponse = components["schemas"]["SipsResponse"];
type ContractSignRequest = components["schemas"]["ContractSignRequest"];

/**
 * MSW handlers for Sprint 3 endpoints: CUPS, Products, Contracts, Quotes, OCR.
 *
 * These are exported separately and merged into the main handlers array
 * to keep file sizes manageable (<300 lines per file).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// In-memory stores
const cupsStore: CupsOut[] = [...CUPS_FIXTURES];
const productsStore: ProductOut[] = [...PRODUCT_FIXTURES];
const contractsStore: ContractOut[] = [...CONTRACT_FIXTURES];

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

// reason: same as handlers.ts — DTO → Record<string, unknown> for HttpResponse.json
function asJson<T>(value: T): Record<string, unknown> {
  return value as unknown as Record<string, unknown>;
}

// ── CUPS Handlers ──────────────────────────────────────────────────────────

const listCupsHandler = http.get(`${API_BASE}/v1/cups`, ({ request }) => {
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);
  const q = url.searchParams.get("q")?.toLowerCase();

  let filtered = [...cupsStore];
  if (q) {
    filtered = filtered.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.distributor_name?.toLowerCase().includes(q),
    );
  }

  const statusFilter = url.searchParams.getAll("status");
  if (statusFilter.length) {
    filtered = filtered.filter((c) =>
      statusFilter.includes(c.status),
    );
  }

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
});

const getCupsHandler = http.get(
  `${API_BASE}/v1/cups/:cupsId`,
  ({ params }) => {
    const cups = cupsStore.find((c) => c.id === params.cupsId);
    if (!cups) return problemResponse(404, "CUPS no encontrado");
    return HttpResponse.json(asJson(cups), { headers: correlationHeaders() });
  },
);

const createCupsHandler = http.post(
  `${API_BASE}/v1/cups`,
  async ({ request }) => {
    const body = (await request.json()) as CupsCreate;
    const now = new Date().toISOString();
    const newCups: CupsOut = {
      id: crypto.randomUUID(),
      tenant_id: TENANT_ID,
      code: body.code,
      lead_id: body.lead_id ?? null,
      country: "ES",
      energy_type: body.energy_type ?? "electricity",
      address: body.address ?? null,
      city: body.city ?? null,
      postal_code: body.postal_code ?? null,
      province: body.province ?? null,
      distributor_code: body.distributor_code ?? null,
      distributor_name: body.distributor_name ?? null,
      tariff_access_code: body.tariff_access_code ?? null,
      power_p1_kw: body.power_p1_kw != null ? String(body.power_p1_kw) : null,
      power_p2_kw: body.power_p2_kw != null ? String(body.power_p2_kw) : null,
      power_p3_kw: body.power_p3_kw != null ? String(body.power_p3_kw) : null,
      power_p4_kw: body.power_p4_kw != null ? String(body.power_p4_kw) : null,
      power_p5_kw: body.power_p5_kw != null ? String(body.power_p5_kw) : null,
      power_p6_kw: body.power_p6_kw != null ? String(body.power_p6_kw) : null,
      status: "draft",
      sips_fetched_at: null,
      created_at: now,
      updated_at: now,
    };
    cupsStore.unshift(newCups);
    return HttpResponse.json(asJson(newCups), {
      status: 201,
      headers: correlationHeaders(),
    });
  },
);

const updateCupsHandler = http.patch(
  `${API_BASE}/v1/cups/:cupsId`,
  async ({ params, request }) => {
    const idx = cupsStore.findIndex((c) => c.id === params.cupsId);
    if (idx < 0) return problemResponse(404, "CUPS no encontrado");
    const body = (await request.json()) as CupsUpdate;
    const cups = cupsStore[idx]!;
    const updated: CupsOut = {
      ...cups,
      address: body.address ?? cups.address,
      city: body.city ?? cups.city,
      postal_code: body.postal_code ?? cups.postal_code,
      province: body.province ?? cups.province,
      distributor_code: body.distributor_code ?? cups.distributor_code,
      distributor_name: body.distributor_name ?? cups.distributor_name,
      tariff_access_code: body.tariff_access_code ?? cups.tariff_access_code,
      updated_at: new Date().toISOString(),
    };
    cupsStore[idx] = updated;
    return HttpResponse.json(asJson(updated), { headers: correlationHeaders() });
  },
);

const deleteCupsHandler = http.delete(
  `${API_BASE}/v1/cups/:cupsId`,
  ({ params }) => {
    const idx = cupsStore.findIndex((c) => c.id === params.cupsId);
    if (idx < 0) return problemResponse(404, "CUPS no encontrado");
    cupsStore.splice(idx, 1);
    return new HttpResponse(null, {
      status: 204,
      headers: correlationHeaders(),
    });
  },
);

const getSipsHandler = http.get(
  `${API_BASE}/v1/cups/:code/sips`,
  ({ params }) => {
    const code = String(params.code);
    const cups = cupsStore.find((c) => c.code === code);
    const sips: SipsResponse = {
      code,
      cached: !cups?.sips_fetched_at,
      distributor_code: cups?.distributor_code ?? "0021",
      distributor_name: cups?.distributor_name ?? "Iberdrola Distribución",
      tariff_access_code: cups?.tariff_access_code ?? "2.0TD",
      address: cups?.address ?? "Dirección mock SIPS",
      city: cups?.city ?? "Madrid",
      postal_code: cups?.postal_code ?? "28001",
      province: cups?.province ?? "Madrid",
      consumption_12m_kwh: "3500",
      contracted_power_kw: {
        p1: cups?.power_p1_kw ?? "5.750",
        p2: cups?.power_p2_kw ?? "5.750",
      },
      fetched_at: new Date().toISOString(),
    };
    // Update CUPS sips_fetched_at if found
    if (cups) {
      const idx = cupsStore.indexOf(cups);
      cupsStore[idx] = { ...cups, sips_fetched_at: new Date().toISOString() };
    }
    return HttpResponse.json(asJson(sips), { headers: correlationHeaders() });
  },
);

// ── Products Handlers ──────────────────────────────────────────────────────

const listProductsHandler = http.get(
  `${API_BASE}/v1/products`,
  ({ request }) => {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
    const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);
    const items = productsStore.slice(offset, offset + limit);
    return HttpResponse.json(
      {
        items: items.map(asJson),
        total: productsStore.length,
        limit,
        offset,
      },
      { headers: correlationHeaders() },
    );
  },
);

const getProductHandler = http.get(
  `${API_BASE}/v1/products/:productId`,
  ({ params }) => {
    const product = productsStore.find((p) => p.id === params.productId);
    if (!product) return problemResponse(404, "Producto no encontrado");
    return HttpResponse.json(asJson(product), {
      headers: correlationHeaders(),
    });
  },
);

const createProductHandler = http.post(
  `${API_BASE}/v1/products`,
  async ({ request }) => {
    const body = (await request.json()) as ProductCreate;
    const now = new Date().toISOString();
    const newProduct: ProductOut = {
      id: crypto.randomUUID(),
      tenant_id: TENANT_ID,
      code: body.code,
      name: body.name,
      energy_type: body.energy_type ?? "electricity",
      tariff_kind: body.tariff_kind ?? "fixed",
      term_months: body.term_months ?? 12,
      currency: body.currency ?? "EUR",
      pricing: body.pricing ?? {},
      notes: body.notes ?? null,
      status: "draft",
      created_at: now,
      updated_at: now,
    };
    productsStore.unshift(newProduct);
    return HttpResponse.json(asJson(newProduct), {
      status: 201,
      headers: correlationHeaders(),
    });
  },
);

const deleteProductHandler = http.delete(
  `${API_BASE}/v1/products/:productId`,
  ({ params }) => {
    const idx = productsStore.findIndex((p) => p.id === params.productId);
    if (idx < 0) return problemResponse(404, "Producto no encontrado");
    productsStore.splice(idx, 1);
    return new HttpResponse(null, {
      status: 204,
      headers: correlationHeaders(),
    });
  },
);

// ── Contracts Handlers ─────────────────────────────────────────────────────

const listContractsHandler = http.get(
  `${API_BASE}/v1/contracts`,
  ({ request }) => {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
    const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);
    const q = url.searchParams.get("q")?.toLowerCase();
    const statuses = url.searchParams.getAll("status") as ContractStatus[];

    let filtered = [...contractsStore];
    if (q) {
      filtered = filtered.filter(
        (c) =>
          c.number.toLowerCase().includes(q) ||
          c.customer_name.toLowerCase().includes(q),
      );
    }
    if (statuses.length) {
      filtered = filtered.filter((c) => statuses.includes(c.status));
    }

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

const getContractHandler = http.get(
  `${API_BASE}/v1/contracts/:contractId`,
  ({ params }) => {
    const contract = contractsStore.find((c) => c.id === params.contractId);
    if (!contract) return problemResponse(404, "Contrato no encontrado");
    return HttpResponse.json(asJson(contract), {
      headers: correlationHeaders(),
    });
  },
);

const createContractHandler = http.post(
  `${API_BASE}/v1/contracts`,
  async ({ request }) => {
    const body = (await request.json()) as ContractCreate;
    const now = new Date().toISOString();
    const num = `PE-2026-${String(contractsStore.length + 1).padStart(4, "0")}`;
    const newContract: ContractOut = {
      id: crypto.randomUUID(),
      tenant_id: TENANT_ID,
      lead_id: body.lead_id,
      cups_id: body.cups_id,
      product_id: body.product_id,
      number: num,
      customer_name: body.customer_name,
      customer_tax_id: body.customer_tax_id,
      customer_email: body.customer_email ?? null,
      customer_phone_e164: body.customer_phone_e164 ?? null,
      billing_address: body.billing_address ?? null,
      status: "draft",
      start_date: body.start_date ?? null,
      term_months: body.term_months ?? 12,
      currency: body.currency ?? "EUR",
      extra: body.extra ?? {},
      pdf_storage_key: null,
      pdf_storage_bucket: null,
      pdf_sha256: null,
      pdf_generated_at: null,
      signature_provider: null,
      signature_provider_id: null,
      signature_requested_at: null,
      signed_at: null,
      sent_to_dso_at: null,
      activated_at: null,
      cancelled_at: null,
      rejected_at: null,
      rejection_reason: null,
      created_at: now,
      updated_at: now,
    };
    contractsStore.unshift(newContract);
    return HttpResponse.json(asJson(newContract), {
      status: 201,
      headers: correlationHeaders(),
    });
  },
);

const updateContractHandler = http.patch(
  `${API_BASE}/v1/contracts/:contractId`,
  async ({ params, request }) => {
    const idx = contractsStore.findIndex((c) => c.id === params.contractId);
    if (idx < 0) return problemResponse(404, "Contrato no encontrado");
    const body = (await request.json()) as ContractUpdate;
    const contract = contractsStore[idx]!;
    const updated: ContractOut = {
      ...contract,
      customer_name: body.customer_name ?? contract.customer_name,
      customer_tax_id: body.customer_tax_id ?? contract.customer_tax_id,
      customer_email: body.customer_email ?? contract.customer_email,
      customer_phone_e164: body.customer_phone_e164 ?? contract.customer_phone_e164,
      billing_address: body.billing_address ?? contract.billing_address,
      start_date: body.start_date ?? contract.start_date,
      term_months: body.term_months ?? contract.term_months,
      updated_at: new Date().toISOString(),
    };
    contractsStore[idx] = updated;
    return HttpResponse.json(asJson(updated), { headers: correlationHeaders() });
  },
);

const cancelContractHandler = http.post(
  `${API_BASE}/v1/contracts/:contractId/cancel`,
  async ({ params }) => {
    const idx = contractsStore.findIndex((c) => c.id === params.contractId);
    if (idx < 0) return problemResponse(404, "Contrato no encontrado");
    const contract = contractsStore[idx]!;
    const cancelled: ContractOut = {
      ...contract,
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    contractsStore[idx] = cancelled;
    return HttpResponse.json(asJson(cancelled), {
      headers: correlationHeaders(),
    });
  },
);

const generatePdfHandler = http.post(
  `${API_BASE}/v1/contracts/:contractId/pdf`,
  ({ params }) => {
    const idx = contractsStore.findIndex((c) => c.id === params.contractId);
    if (idx < 0) return problemResponse(404, "Contrato no encontrado");
    const contract = contractsStore[idx]!;
    const now = new Date().toISOString();
    const updated: ContractOut = {
      ...contract,
      pdf_storage_key: `contracts/${contract.number}.pdf`,
      pdf_storage_bucket: "panda-docs",
      pdf_sha256: crypto.randomUUID().replace(/-/g, ""),
      pdf_generated_at: now,
      updated_at: now,
    };
    contractsStore[idx] = updated;
    return HttpResponse.json(asJson(updated), { headers: correlationHeaders() });
  },
);

const downloadPdfHandler = http.get(
  `${API_BASE}/v1/contracts/:contractId/pdf`,
  ({ params }) => {
    const contract = contractsStore.find((c) => c.id === params.contractId);
    if (!contract) return problemResponse(404, "Contrato no encontrado");
    if (!contract.pdf_storage_key) {
      return problemResponse(404, "PDF no generado aún");
    }
    // Return a mock PDF (empty)
    return new HttpResponse(new Blob(["mock-pdf-content"], { type: "application/pdf" }), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${contract.number}.pdf"`,
        ...correlationHeaders(),
      },
    });
  },
);

const signContractHandler = http.post(
  `${API_BASE}/v1/contracts/:contractId/sign`,
  async ({ params, request }) => {
    const idx = contractsStore.findIndex((c) => c.id === params.contractId);
    if (idx < 0) return problemResponse(404, "Contrato no encontrado");
    const body = (await request.json()) as ContractSignRequest;
    const contract = contractsStore[idx]!;
    const now = new Date().toISOString();
    const signatureRequestId = crypto.randomUUID();
    const updated: ContractOut = {
      ...contract,
      signature_provider: "signaturit",
      signature_provider_id: `sig-${Date.now()}`,
      signature_requested_at: now,
      updated_at: now,
    };
    contractsStore[idx] = updated;
    return HttpResponse.json(
      {
        signature_request_id: signatureRequestId,
        provider: "signaturit",
        provider_id: updated.signature_provider_id,
        requested_at: now,
        contract: asJson(updated),
      },
      { headers: correlationHeaders() },
    );
  },
);

// ── Quotes Handler ─────────────────────────────────────────────────────────

const calculateQuoteHandler = http.post(
  `${API_BASE}/v1/quotes/calculate`,
  async ({ request }) => {
    const body = (await request.json()) as QuoteCalculateRequest;
    const baseline = Number(body.baseline.annual_total_eur);
    // Mock: ~15% savings
    const savings = baseline * 0.15;
    const projected = baseline - savings;
    const response: QuoteCalculateResponse = {
      baseline_eur: baseline.toFixed(2),
      projected_eur: projected.toFixed(2),
      savings_eur: savings.toFixed(2),
      savings_pct: "15.00",
      assumptions: [
        "Consumo anual estimado: " + String(body.baseline.annual_energy_kwh) + " kWh",
        "Tarifa actual estimada: " + baseline.toFixed(2) + " EUR/anio",
        "Ahorro basado en tarifa media del producto seleccionado",
      ],
    };
    return HttpResponse.json(asJson(response), {
      headers: correlationHeaders(),
    });
  },
);

// ── OCR Handler ────────────────────────────────────────────────────────────

const ocrHandler = http.post(
  `${API_BASE}/v1/leads/:leadId/invoices/ocr`,
  async () => {
    // Mock OCR response
    return HttpResponse.json(
      {
        provider: "openai",
        model: "gpt-4o-mini",
        cups: "ES0021000011223344AA",
        tariff_access_code: "2.0TD",
        contracted_power_kw: "5.750",
        annual_energy_kwh: "3500",
        annual_total_eur: "720.50",
        billing_period_days: 30,
        supplier: "Endesa Energía",
        input_tokens: 1200,
        output_tokens: 150,
      },
      { headers: correlationHeaders() },
    );
  },
);

export const sprint3Handlers = [
  // CUPS
  listCupsHandler,
  getCupsHandler,
  createCupsHandler,
  updateCupsHandler,
  deleteCupsHandler,
  getSipsHandler,
  // Products
  listProductsHandler,
  getProductHandler,
  createProductHandler,
  deleteProductHandler,
  // Contracts
  listContractsHandler,
  getContractHandler,
  createContractHandler,
  updateContractHandler,
  cancelContractHandler,
  generatePdfHandler,
  downloadPdfHandler,
  signContractHandler,
  // Quotes
  calculateQuoteHandler,
  // OCR
  ocrHandler,
];
