import type { components } from "@/lib/api/types";

type Pipeline = components["schemas"]["PipelineOut"];
type PipelineStage = components["schemas"]["PipelineStageOut"];

/**
 * Dos pipelines fixture:
 *  - "Default" — 5 stages alineados con `LeadStatus` (new/contacted/qualified/
 *    won/lost). Semilla que el backend provee para todo tenant nuevo.
 *  - "Empresas" — 6 stages (Prospecto inicial → Auditoría energética →
 *    Propuesta enviada → Negociación → Cerrado-Ganado → Cerrado-Perdido).
 *    Útil para B2B/industrial. `Auditoría energética` declara
 *    `entry_criteria` para demostrar el toast warning en Kanban.
 *
 * UUIDs determinísticos para que los fixtures de leads/activities puedan
 * referenciarlos sin generar runtime.
 *
 * Cada pipeline tiene UN stage `is_won=true` y UN stage `is_lost=true`; el
 * resto son terminales=false. El slug match con `LeadStatus` permite al
 * handler MSW mapear `status → stage_id` por slug dentro del pipeline.
 */

export const TENANT_ID = "11111111-1111-1111-1111-111111111111";
// reason: alias legacy — varios stories / tests viejos lo importan. Se
// reemplaza por USER_IDS.carlos en handlers/users; lo mantenemos exportado
// para no romper imports indirectos.
export const OWNER_ID = "22222222-2222-2222-2222-222222222222";

export const DEFAULT_PIPELINE_ID = "33333333-3333-3333-3333-333333333333";
export const EMPRESAS_PIPELINE_ID = "33333333-3333-3333-3333-333333333334";

/**
 * Stage IDs de la pipeline Default. Mantienen el patrón legacy
 * `44444444-4444-4444-4444-440000000…` para no romper fixtures previos.
 */
export const STAGE_IDS = {
  new: "44444444-4444-4444-4444-440000000001",
  contacted: "44444444-4444-4444-4444-440000000002",
  qualified: "44444444-4444-4444-4444-440000000003",
  won: "44444444-4444-4444-4444-440000000004",
  lost: "44444444-4444-4444-4444-440000000005",
} as const;

/**
 * Stage IDs de la pipeline Empresas. Patrón `…45…` para distinguirlos del
 * default a simple vista.
 */
export const EMPRESAS_STAGE_IDS = {
  new: "44444444-4444-4444-4444-450000000001",
  contacted: "44444444-4444-4444-4444-450000000002",
  qualified: "44444444-4444-4444-4444-450000000003",
  negotiation: "44444444-4444-4444-4444-450000000004",
  won: "44444444-4444-4444-4444-450000000005",
  lost: "44444444-4444-4444-4444-450000000006",
} as const;

const seededAt = "2026-04-01T08:00:00.000Z";

export const defaultStagesFixture: PipelineStage[] = [
  {
    id: STAGE_IDS.new,
    pipeline_id: DEFAULT_PIPELINE_ID,
    name: "Nuevo",
    slug: "new",
    position: 10,
    is_won: false,
    is_lost: false,
    created_at: seededAt,
    updated_at: seededAt,
  },
  {
    id: STAGE_IDS.contacted,
    pipeline_id: DEFAULT_PIPELINE_ID,
    name: "Contactado",
    slug: "contacted",
    position: 20,
    is_won: false,
    is_lost: false,
    created_at: seededAt,
    updated_at: seededAt,
  },
  {
    id: STAGE_IDS.qualified,
    pipeline_id: DEFAULT_PIPELINE_ID,
    name: "Cualificado",
    slug: "qualified",
    position: 30,
    is_won: false,
    is_lost: false,
    created_at: seededAt,
    updated_at: seededAt,
  },
  {
    id: STAGE_IDS.won,
    pipeline_id: DEFAULT_PIPELINE_ID,
    name: "Ganado",
    slug: "won",
    position: 40,
    is_won: true,
    is_lost: false,
    created_at: seededAt,
    updated_at: seededAt,
  },
  {
    id: STAGE_IDS.lost,
    pipeline_id: DEFAULT_PIPELINE_ID,
    name: "Perdido",
    slug: "lost",
    position: 50,
    is_won: false,
    is_lost: true,
    created_at: seededAt,
    updated_at: seededAt,
  },
];

/**
 * Pipeline Empresas — 6 stages. `Auditoría energética` lleva
 * `entry_criteria` para que el Kanban dispare el toast warning al soltar
 * una card sin CUPS.
 */
export const empresasStagesFixture: PipelineStage[] = [
  {
    id: EMPRESAS_STAGE_IDS.new,
    pipeline_id: EMPRESAS_PIPELINE_ID,
    name: "Prospecto inicial",
    slug: "new",
    position: 10,
    is_won: false,
    is_lost: false,
    created_at: seededAt,
    updated_at: seededAt,
  },
  {
    id: EMPRESAS_STAGE_IDS.contacted,
    pipeline_id: EMPRESAS_PIPELINE_ID,
    name: "Auditoría energética",
    slug: "contacted",
    position: 20,
    is_won: false,
    is_lost: false,
    entry_criteria: [
      { type: "requires_cups", description: "Requiere CUPS válido" },
    ],
    created_at: seededAt,
    updated_at: seededAt,
  },
  {
    id: EMPRESAS_STAGE_IDS.qualified,
    pipeline_id: EMPRESAS_PIPELINE_ID,
    name: "Propuesta enviada",
    slug: "qualified",
    position: 30,
    is_won: false,
    is_lost: false,
    created_at: seededAt,
    updated_at: seededAt,
  },
  {
    id: EMPRESAS_STAGE_IDS.negotiation,
    pipeline_id: EMPRESAS_PIPELINE_ID,
    name: "Negociación",
    slug: "negotiation",
    position: 40,
    is_won: false,
    is_lost: false,
    entry_criteria: [
      {
        type: "requires_estimated_value",
        description: "Requiere estimación de consumo confirmada",
      },
    ],
    created_at: seededAt,
    updated_at: seededAt,
  },
  {
    id: EMPRESAS_STAGE_IDS.won,
    pipeline_id: EMPRESAS_PIPELINE_ID,
    name: "Cerrado-Ganado",
    slug: "won",
    position: 50,
    is_won: true,
    is_lost: false,
    created_at: seededAt,
    updated_at: seededAt,
  },
  {
    id: EMPRESAS_STAGE_IDS.lost,
    pipeline_id: EMPRESAS_PIPELINE_ID,
    name: "Cerrado-Perdido",
    slug: "lost",
    position: 60,
    is_won: false,
    is_lost: true,
    created_at: seededAt,
    updated_at: seededAt,
  },
];

export const defaultPipelineFixture: Pipeline = {
  id: DEFAULT_PIPELINE_ID,
  tenant_id: TENANT_ID,
  name: "Default",
  slug: "default",
  is_default: true,
  stages: defaultStagesFixture,
  created_at: seededAt,
  updated_at: seededAt,
};

export const empresasPipelineFixture: Pipeline = {
  id: EMPRESAS_PIPELINE_ID,
  tenant_id: TENANT_ID,
  name: "Empresas",
  slug: "empresas",
  is_default: false,
  stages: empresasStagesFixture,
  created_at: seededAt,
  updated_at: seededAt,
};

export const pipelinesFixture: Pipeline[] = [
  defaultPipelineFixture,
  empresasPipelineFixture,
];

/**
 * Unión plana de stages — usado por el handler MSW para resolver
 * `stage_id → stage` cross-pipeline (move, status mapping, bulk).
 */
export const allStagesFixture: PipelineStage[] = [
  ...defaultStagesFixture,
  ...empresasStagesFixture,
];
