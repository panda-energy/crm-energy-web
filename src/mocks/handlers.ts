import { http, HttpResponse } from "msw";
import type { components } from "@/lib/api/types";
import { ACTIVITY_FIXTURES } from "./fixtures/activities";
import { LEAD_FIXTURES } from "./fixtures/leads";
import {
  STAGE_IDS,
  TENANT_ID,
  allStagesFixture,
  pipelinesFixture,
  DEFAULT_PIPELINE_ID,
} from "./fixtures/pipelines";
import { usersFixture, currentUserFixture } from "./fixtures/users";

type Lead = components["schemas"]["LeadOut"];
type LeadCreate = components["schemas"]["LeadCreate"];
type LeadUpdate = components["schemas"]["LeadUpdate"];
type LeadMove = components["schemas"]["LeadMove"];
type LeadBulkAction = components["schemas"]["LeadBulkAction"];
type LeadBulkResult = components["schemas"]["LeadBulkResult"];
type LeadPage = components["schemas"]["Page_LeadOut_"];
type LeadStatus = components["schemas"]["LeadStatus"];
type LeadSource = components["schemas"]["LeadSource"];
type ActivityCreate = components["schemas"]["ActivityCreate"];
type MeOut = components["schemas"]["MeOut"];
type UserListItem = components["schemas"]["UserListItem"];
type UserListPage = components["schemas"]["UserListPage"];
type UserRole = components["schemas"]["UserRole"];

/**
 * Activity persisted by MSW — espejo simplificado de la union discriminada
 * `ActivityOut` del backend (cleanup wave). MSW solo emite los 4 tipos
 * que la UI demo necesita (`stage_changed`, `status_changed`, `note`,
 * `call`, `email`, `lead_created`, `restored`, `bulk_action`); el resto
 * de variantes se ignoran porque MSW no simula WhatsApp ni system events.
 */
type StoredActivity = {
  id: string;
  lead_id: string;
  actor_user_id: string | null;
  summary: string | null;
  occurred_at: string;
  created_at: string;
  type: string;
  payload: Record<string, unknown>;
};

/**
 * Handlers MSW — espejo simplificado del backend Sprint 2 (cleanup wave).
 *
 * Cobertura:
 *  - GET /v1/auth/me (cleanup wave).
 *  - GET /v1/users (cleanup wave, paginación + filtros q/role).
 *  - GET /v1/leads (filtros: statuses, sources, owner_id, q, sort, limit, offset).
 *  - GET /v1/leads/{lead_id}.
 *  - POST /v1/leads (Idempotency-Key honrado).
 *  - PATCH /v1/leads/{lead_id}.
 *  - DELETE /v1/leads/{lead_id} (soft, devuelve 204).
 *  - POST /v1/leads/{lead_id}/restore (idempotente, 204).
 *  - POST /v1/leads/bulk (action: update | delete).
 *  - POST /v1/leads/{lead_id}/move (cambia stage; respeta `position`).
 *  - GET /v1/leads/{lead_id}/activities (paginado).
 *  - POST /v1/leads/{lead_id}/activities (manual note/call/email).
 *  - GET /v1/pipelines.
 *  - GET /v1/pipelines/{pipeline_id}.
 *  - GET /v1/pipelines/{pipeline_id}/stages.
 *
 * **No cubierto** (se prueba contra backend real en Sprint 2):
 *  - POST /v1/leads/{lead_id}/whatsapp/send.
 *  - POST/PATCH/PUT pipelines.
 *  - /webhooks/*, /healthz, /readyz.
 *
 * Notas:
 *  - El backend exige Bearer JWT real. MSW lo ignora — los tests no necesitan
 *    auth y el frontend en modo demo tampoco. Si una request llega sin
 *    Authorization NO devolvemos 401 aquí; el backend real sí lo hará.
 *  - El backend filtra por tenant via RLS (JWT claim `org_id`). MSW devuelve
 *    siempre datos del tenant fixture — no simulamos cross-tenant.
 *  - Devolvemos errors en formato Problem RFC 7807 con `correlationId` y
 *    header `x-correlation-id`.
 *  - Soportamos `Idempotency-Key` con cache simple. Misma key + body distinto
 *    → 409 como el backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Estado mutable in-memory. Cada reload del worker / setupServer lo resetea.
const leadsStore: Lead[] = [...LEAD_FIXTURES];
const deletedLeadsStore = new Map<string, Lead>();
// reason: pre-seed con ~100 actividades (1 `lead_created` por lead + extras
// variados) para que la demo tenga histórico realista al abrir cualquier
// detalle. Cualquier mutación posterior (move, restore, bulk, create)
// añade más entradas in-memory.
const activitiesStore: StoredActivity[] = [...ACTIVITY_FIXTURES];

// Cache de Idempotency-Key → { bodyHash, response }. Sin TTL — duración del
// proceso.
interface IdempotencyEntry {
  bodyHash: string;
  response: Record<string, unknown> | unknown[];
  status: number;
}

/**
 * Helper para narrow de cualquier DTO del backend (Lead, Activity, …) a la
 * forma `Record<string, unknown>` que `HttpResponse.json` y la cache aceptan.
 *
 * reason: los tipos OpenAPI tienen uniones con `null` en propiedades, lo que
 * los hace NO asignables directamente a `Record<string, any>`. Sin embargo,
 * en runtime son siempre objetos JSON serializables. Este cast es seguro
 * porque los DTOs son por definición objetos planos.
 */
function asJson<T>(value: T): Record<string, unknown> {
  return value as unknown as Record<string, unknown>;
}
const idempotencyCache = new Map<string, IdempotencyEntry>();

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

async function hashBody(body: unknown): Promise<string> {
  // reason: hash determinista del body para detectar Idempotency-Key con
  // payload distinto. SHA-256 hex; SubtleCrypto está disponible en Node 20+
  // (vitest) y en navegadores modernos.
  const data = new TextEncoder().encode(JSON.stringify(body ?? null));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Aplica un Idempotency-Key cache check. Si encuentra match con el mismo
 * body, devuelve la respuesta cacheada. Si encuentra match con body
 * distinto, devuelve 409. Si no hay key, deja pasar.
 */
async function withIdempotency<TBody>(
  request: Request,
  body: TBody,
  exec: () => Promise<{
    status: number;
    response: Record<string, unknown> | unknown[];
  }>,
): Promise<Response> {
  const key = request.headers.get("Idempotency-Key");
  if (!key) {
    const r = await exec();
    return HttpResponse.json(r.response, {
      status: r.status,
      headers: correlationHeaders(),
    });
  }
  const bodyHash = await hashBody(body);
  const cached = idempotencyCache.get(key);
  if (cached) {
    if (cached.bodyHash !== bodyHash) {
      return problemResponse(
        409,
        "Idempotency-Key reutilizada con body distinto",
        `La key ${key} ya fue usada con otro payload en este endpoint.`,
      );
    }
    return HttpResponse.json(cached.response, {
      status: cached.status,
      headers: correlationHeaders(),
    });
  }
  const r = await exec();
  idempotencyCache.set(key, {
    bodyHash,
    response: r.response,
    status: r.status,
  });
  return HttpResponse.json(r.response, {
    status: r.status,
    headers: correlationHeaders(),
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────

function findLead(leadId: string): Lead | undefined {
  return leadsStore.find((l) => l.id === leadId);
}

function getAllValues(url: URL, name: string): string[] {
  return url.searchParams.getAll(name);
}

/**
 * Deriva el `LeadStatus` coarse a partir del `stage_id`. Backend hace lo
 * mismo via `is_won`/`is_lost` + slug; aquí buscamos el stage en
 * `allStagesFixture` (union de ambas pipelines).
 */
function statusFromStageId(stageId: string): LeadStatus {
  const stage = allStagesFixture.find((s) => s.id === stageId);
  if (!stage) return "new";
  if (stage.is_won) return "won";
  if (stage.is_lost) return "lost";
  // Slug del stage coincide con LeadStatus para `new`/`contacted`/
  // `qualified`. Stages como `negotiation` caen a `qualified` (pre-won).
  if (stage.slug === "contacted") return "contacted";
  if (stage.slug === "qualified") return "qualified";
  if (stage.slug === "negotiation") return "qualified";
  return "new";
}

function matchesFilters(lead: Lead, url: URL): boolean {
  const statuses = getAllValues(url, "statuses") as LeadStatus[];
  if (statuses.length && !statuses.includes(lead.status)) return false;

  const sources = getAllValues(url, "sources") as LeadSource[];
  if (sources.length && !sources.includes(lead.source)) return false;

  const ownerIds = getAllValues(url, "owner_id");
  if (ownerIds.length && (!lead.owner_id || !ownerIds.includes(lead.owner_id))) {
    return false;
  }

  const pipelineIds = getAllValues(url, "pipeline_id");
  if (pipelineIds.length && !pipelineIds.includes(lead.pipeline_id)) return false;

  const stageIds = getAllValues(url, "stage_id");
  if (stageIds.length && !stageIds.includes(lead.stage_id)) return false;

  const tags = getAllValues(url, "tag");
  if (tags.length && !tags.some((t) => lead.tags.includes(t))) return false;

  const q = url.searchParams.get("q");
  if (q) {
    const needle = q.toLowerCase();
    const haystacks = [
      lead.first_name,
      lead.last_name,
      lead.email,
      lead.phone_e164,
      lead.company,
    ];
    if (!haystacks.some((h) => h?.toLowerCase().includes(needle))) {
      return false;
    }
  }

  const createdFrom = url.searchParams.get("created_from");
  if (createdFrom && lead.created_at < createdFrom) return false;

  const createdTo = url.searchParams.get("created_to");
  if (createdTo && lead.created_at > createdTo) return false;

  return true;
}

function sortLeads(leads: Lead[], url: URL): Lead[] {
  const sort = (url.searchParams.get("sort") ??
    "created_at") as keyof Lead;
  const direction = url.searchParams.get("direction") ?? "desc";
  const sorted = [...leads].sort((a, b) => {
    const va = a[sort] ?? "";
    const vb = b[sort] ?? "";
    if (va < vb) return direction === "asc" ? -1 : 1;
    if (va > vb) return direction === "asc" ? 1 : -1;
    return 0;
  });
  return sorted;
}

// ── Handlers ───────────────────────────────────────────────────────────────

// ── Auth ───────────────────────────────────────────────────────────────────

const getMeHandler = http.get(`${API_BASE}/v1/auth/me`, () => {
  const me: MeOut = {
    ...currentUserFixture,
    default_pipeline_id: DEFAULT_PIPELINE_ID,
  };
  return HttpResponse.json(asJson(me), { headers: correlationHeaders() });
});

// ── Users ──────────────────────────────────────────────────────────────────

const listUsersHandler = http.get(`${API_BASE}/v1/users`, ({ request }) => {
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);
  const q = url.searchParams.get("q")?.toLowerCase() ?? "";
  const roles = getAllValues(url, "role") as UserRole[];

  let filtered = [...usersFixture];
  if (q) {
    filtered = filtered.filter((u) => {
      const haystack = `${u.email} ${u.name ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }
  if (roles.length) {
    filtered = filtered.filter((u) => roles.includes(u.role));
  }
  const items = filtered.slice(offset, offset + limit);
  const body: UserListPage = {
    items: items as UserListItem[],
    total: filtered.length,
    limit,
    offset,
  };
  return HttpResponse.json(asJson(body), { headers: correlationHeaders() });
});

const listLeadsHandler = http.get(`${API_BASE}/v1/leads`, ({ request }) => {
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

  const filtered = leadsStore.filter((l) => matchesFilters(l, url));
  const sorted = sortLeads(filtered, url);
  const page = sorted.slice(offset, offset + limit);

  const body: LeadPage = {
    items: page,
    total: sorted.length,
    limit,
    offset,
  };
  return HttpResponse.json(asJson(body), { headers: correlationHeaders() });
});

const getLeadHandler = http.get(
  `${API_BASE}/v1/leads/:leadId`,
  ({ params }) => {
    const lead = findLead(String(params.leadId));
    if (!lead) {
      return problemResponse(404, "Lead no encontrado");
    }
    return HttpResponse.json(asJson(lead), { headers: correlationHeaders() });
  },
);

const createLeadHandler = http.post(
  `${API_BASE}/v1/leads`,
  async ({ request }) => {
    const body = (await request.json()) as LeadCreate;
    return withIdempotency(request, body, async () => {
      const now = new Date().toISOString();
      const stageId = body.stage_id ?? STAGE_IDS.new;
      const newLead: Lead = {
        id: crypto.randomUUID(),
        tenant_id: TENANT_ID,
        pipeline_id: body.pipeline_id ?? pipelinesFixture[0]!.id,
        stage_id: stageId,
        owner_id: body.owner_id ?? null,
        first_name: body.first_name ?? null,
        last_name: body.last_name ?? null,
        email: body.email ?? null,
        // reason: el backend normaliza phone → E.164. MSW guarda tal cual.
        phone_e164: body.phone ?? null,
        company: body.company ?? null,
        cups: body.cups ?? null,
        status: statusFromStageId(stageId),
        source: body.source ?? "manual",
        source_ref: body.source_ref ?? null,
        tags: body.tags ?? [],
        custom_fields: body.custom_fields ?? {},
        estimated_value_cents: body.estimated_value_cents ?? null,
        currency: body.currency ?? "EUR",
        last_contacted_at: null,
        position: null,
        created_at: now,
        updated_at: now,
      };
      leadsStore.unshift(newLead);
      return { status: 201, response: asJson(newLead) };
    });
  },
);

const updateLeadHandler = http.patch(
  `${API_BASE}/v1/leads/:leadId`,
  async ({ params, request }) => {
    const lead = findLead(String(params.leadId));
    if (!lead) return problemResponse(404, "Lead no encontrado");
    const body = (await request.json()) as LeadUpdate;
    return withIdempotency(request, body, async () => {
      // reason: cleanup wave — `phone` con `''` o `null` borra el teléfono
      // explícitamente (formalizado en el contrato OpenAPI).
      const phoneNext =
        body.phone === "" || body.phone === null
          ? null
          : (body.phone ?? lead.phone_e164);
      const updated: Lead = {
        ...lead,
        first_name: body.first_name ?? lead.first_name,
        last_name: body.last_name ?? lead.last_name,
        email: body.email ?? lead.email,
        phone_e164: phoneNext,
        company: body.company ?? lead.company,
        cups: body.cups ?? lead.cups,
        source: body.source ?? lead.source,
        source_ref: body.source_ref ?? lead.source_ref,
        owner_id: body.owner_id ?? lead.owner_id,
        tags: body.tags ?? lead.tags,
        custom_fields: body.custom_fields ?? lead.custom_fields,
        estimated_value_cents:
          body.estimated_value_cents ?? lead.estimated_value_cents,
        last_contacted_at: body.last_contacted_at ?? lead.last_contacted_at,
        updated_at: new Date().toISOString(),
      };
      const idx = leadsStore.findIndex((l) => l.id === lead.id);
      if (idx >= 0) leadsStore[idx] = updated;
      return { status: 200, response: asJson(updated) };
    });
  },
);

const deleteLeadHandler = http.delete(
  `${API_BASE}/v1/leads/:leadId`,
  ({ params }) => {
    const leadId = String(params.leadId);
    const idx = leadsStore.findIndex((l) => l.id === leadId);
    if (idx < 0) return problemResponse(404, "Lead no encontrado");
    // reason: guardamos el lead en `deletedLeadsStore` para que restore
    // pueda recuperarlo. El backend usa `deleted_at`; MSW lo separa físicamente
    // del store activo — equivalente funcional para la UI.
    const [deleted] = leadsStore.splice(idx, 1);
    if (deleted) deletedLeadsStore.set(leadId, deleted);
    return new HttpResponse(null, {
      status: 204,
      headers: correlationHeaders(),
    });
  },
);

const restoreLeadHandler = http.post(
  `${API_BASE}/v1/leads/:leadId/restore`,
  ({ params }) => {
    const leadId = String(params.leadId);
    // reason: idempotente. Si el lead nunca fue eliminado o ya fue
    // restaurado, devolvemos 204 igualmente. 404 solo si jamás existió.
    const inStore = leadsStore.some((l) => l.id === leadId);
    const inDeleted = deletedLeadsStore.get(leadId);
    if (!inStore && !inDeleted) {
      return problemResponse(404, "Lead no encontrado");
    }
    if (inDeleted) {
      // Reinsertar al principio (orden no canónico — backend ordena por
      // created_at desc por defecto y el lead conserva su created_at).
      leadsStore.unshift(inDeleted);
      deletedLeadsStore.delete(leadId);
      activitiesStore.push({
        id: crypto.randomUUID(),
        lead_id: leadId,
        actor_user_id: null,
        type: "restored",
        summary: null,
        payload: { restored_from: inDeleted.updated_at },
        occurred_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }
    return new HttpResponse(null, {
      status: 204,
      headers: correlationHeaders(),
    });
  },
);

const bulkLeadsHandler = http.post(
  `${API_BASE}/v1/leads/bulk`,
  async ({ request }) => {
    const body = (await request.json()) as LeadBulkAction;
    return withIdempotency(request, body, async () => {
      const action = body.action ?? "update";
      if (action === "delete") {
        // Soft-delete masivo.
        const deletedIds: string[] = [];
        for (const id of body.ids) {
          const idx = leadsStore.findIndex((l) => l.id === id);
          if (idx < 0) continue;
          const [deleted] = leadsStore.splice(idx, 1);
          if (deleted) {
            deletedLeadsStore.set(id, deleted);
            deletedIds.push(id);
            activitiesStore.push({
              id: crypto.randomUUID(),
              lead_id: id,
              actor_user_id: null,
              type: "bulk_action",
              summary: null,
              payload: { action: "delete", params: { ids_count: body.ids.length } },
              occurred_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            });
          }
        }
        const result: LeadBulkResult = {
          matched: deletedIds.length,
          updated: deletedIds.length,
          ids: deletedIds,
        };
        return { status: 200, response: asJson(result) };
      }

      const matched = leadsStore.filter((l) => body.ids.includes(l.id));
      const updatedIds: string[] = [];
      for (const lead of matched) {
        let changed = false;
        if (body.assign_owner_id !== undefined && body.assign_owner_id !== null) {
          lead.owner_id = body.assign_owner_id;
          changed = true;
        }
        if (body.set_status) {
          lead.status = body.set_status;
          // reason: el backend mueve al primer stage del pipeline del
          // lead cuyo slug matchea el status (NO al pipeline default).
          // Buscamos en el pipeline actual del lead.
          const stage = allStagesFixture.find(
            (s) =>
              s.pipeline_id === lead.pipeline_id && s.slug === body.set_status,
          );
          if (stage) lead.stage_id = stage.id;
          changed = true;
        }
        if (body.add_tags?.length) {
          const merged = new Set([...lead.tags, ...body.add_tags]);
          lead.tags = Array.from(merged);
          changed = true;
        }
        if (body.remove_tags?.length) {
          lead.tags = lead.tags.filter((t) => !body.remove_tags!.includes(t));
          changed = true;
        }
        if (changed) {
          lead.updated_at = new Date().toISOString();
          updatedIds.push(lead.id);
        }
      }
      const result: LeadBulkResult = {
        matched: matched.length,
        updated: updatedIds.length,
        ids: updatedIds,
      };
      return { status: 200, response: asJson(result) };
    });
  },
);

const moveLeadHandler = http.post(
  `${API_BASE}/v1/leads/:leadId/move`,
  async ({ params, request }) => {
    const lead = findLead(String(params.leadId));
    if (!lead) return problemResponse(404, "Lead no encontrado");
    const body = (await request.json()) as LeadMove;
    // reason: el target stage debe pertenecer al pipeline del lead. Buscamos
    // en la unión de stages y validamos pipeline_id explícito (backend hace
    // exactamente esto en `services/leads.py::move_lead`).
    const targetStage = allStagesFixture.find((s) => s.id === body.stage_id);
    if (!targetStage || targetStage.pipeline_id !== lead.pipeline_id) {
      return problemResponse(
        400,
        "Stage no pertenece al pipeline del lead",
        `stage_id ${body.stage_id} no existe o pertenece a otra pipeline.`,
      );
    }
    return withIdempotency(request, body, async () => {
      const previousStageId = lead.stage_id;
      const previousStatus = lead.status;
      lead.stage_id = targetStage.id;
      lead.status = statusFromStageId(targetStage.id);
      // reason: cleanup wave — respetamos `position` opcional (clamping a
      // [0, len(stage)] best-effort; el backend lo hace contra todos los
      // leads vivos del stage).
      if (body.position !== undefined && body.position !== null) {
        const inStage = leadsStore.filter(
          (l) => l.stage_id === targetStage.id && l.id !== lead.id,
        );
        const clamped = Math.max(0, Math.min(body.position, inStage.length));
        lead.position = clamped;
      } else {
        lead.position = null;
      }
      lead.updated_at = new Date().toISOString();

      // Registra `stage_changed` (y `status_changed` si cambió el bucket).
      const baseActivity = {
        id: crypto.randomUUID(),
        lead_id: lead.id,
        actor_user_id: null,
        occurred_at: lead.updated_at,
        created_at: lead.updated_at,
      };
      activitiesStore.push({
        ...baseActivity,
        type: "stage_changed",
        summary: body.note ?? null,
        payload: {
          from_stage_id: previousStageId,
          to_stage_id: targetStage.id,
        },
      });
      if (previousStatus !== lead.status) {
        activitiesStore.push({
          ...baseActivity,
          id: crypto.randomUUID(),
          type: "status_changed",
          summary: null,
          payload: { from_status: previousStatus, to_status: lead.status },
        });
      }
      return { status: 200, response: asJson(lead) };
    });
  },
);

const listActivitiesHandler = http.get(
  `${API_BASE}/v1/leads/:leadId/activities`,
  ({ params, request }) => {
    const lead = findLead(String(params.leadId));
    if (!lead) return problemResponse(404, "Lead no encontrado");
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 200);
    const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);
    const items = activitiesStore
      .filter((a) => a.lead_id === lead.id)
      .sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1))
      .slice(offset, offset + limit);
    return HttpResponse.json(items.map(asJson), {
      headers: correlationHeaders(),
    });
  },
);

const createActivityHandler = http.post(
  `${API_BASE}/v1/leads/:leadId/activities`,
  async ({ params, request }) => {
    const lead = findLead(String(params.leadId));
    if (!lead) return problemResponse(404, "Lead no encontrado");
    const body = (await request.json()) as ActivityCreate;
    if (!["note", "call", "email"].includes(body.type)) {
      return problemResponse(
        400,
        "Tipo de actividad no permitido en este endpoint",
        "Solo note/call/email son creables manualmente.",
      );
    }
    return withIdempotency(request, body, async () => {
      const now = new Date().toISOString();
      const activity: StoredActivity = {
        id: crypto.randomUUID(),
        lead_id: lead.id,
        actor_user_id: null,
        type: body.type,
        summary: body.summary ?? null,
        payload: body.payload ?? {},
        occurred_at: now,
        created_at: now,
      };
      activitiesStore.push(activity);
      // Actualiza last_contacted_at del lead — el backend hace lo mismo
      // para call/email/whatsapp_outbound.
      if (["call", "email"].includes(body.type)) {
        lead.last_contacted_at = now;
        lead.updated_at = now;
      }
      return { status: 201, response: asJson(activity) };
    });
  },
);

// ── Pipelines ──────────────────────────────────────────────────────────────

const listPipelinesHandler = http.get(`${API_BASE}/v1/pipelines`, () =>
  HttpResponse.json(pipelinesFixture.map(asJson), {
    headers: correlationHeaders(),
  }),
);

const getPipelineHandler = http.get(
  `${API_BASE}/v1/pipelines/:pipelineId`,
  ({ params }) => {
    const pipeline = pipelinesFixture.find((p) => p.id === params.pipelineId);
    if (!pipeline) return problemResponse(404, "Pipeline no encontrada");
    return HttpResponse.json(asJson(pipeline), {
      headers: correlationHeaders(),
    });
  },
);

const listStagesHandler = http.get(
  `${API_BASE}/v1/pipelines/:pipelineId/stages`,
  ({ params }) => {
    const pipeline = pipelinesFixture.find((p) => p.id === params.pipelineId);
    if (!pipeline) return problemResponse(404, "Pipeline no encontrada");
    return HttpResponse.json(pipeline.stages.map(asJson), {
      headers: correlationHeaders(),
    });
  },
);

// Sprint 3 handlers (CUPS, Products, Contracts, Quotes, OCR)
import { sprint3Handlers } from "./handlers-sprint3";
// Sprint 4 handlers (ATR messages, Tickets)
import { sprint4Handlers } from "./handlers-sprint4";
// Sprint 5 handlers (AI Chat, Channels/Commissions, Portal)
import { sprint5Handlers } from "./handlers-sprint5";

export const handlers = [
  // Auth
  getMeHandler,
  // Users
  listUsersHandler,
  // Leads
  listLeadsHandler,
  getLeadHandler,
  createLeadHandler,
  updateLeadHandler,
  deleteLeadHandler,
  restoreLeadHandler,
  bulkLeadsHandler,
  moveLeadHandler,
  listActivitiesHandler,
  createActivityHandler,
  // Pipelines
  listPipelinesHandler,
  getPipelineHandler,
  listStagesHandler,
  // Sprint 3
  ...sprint3Handlers,
  // Sprint 4
  ...sprint4Handlers,
  // Sprint 5
  ...sprint5Handlers,
];
