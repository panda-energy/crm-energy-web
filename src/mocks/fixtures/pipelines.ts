import type { components } from "@/lib/api/types";

type Pipeline = components["schemas"]["PipelineOut"];
type PipelineStage = components["schemas"]["PipelineStageOut"];

/**
 * Pipeline + 5 stages que el backend siembra automáticamente al provisionar
 * un tenant. UUIDs determinísticos para que los fixtures de leads puedan
 * referenciarlos.
 *
 * Slugs y `is_won`/`is_lost` espejan la siembra real del backend
 * (`backend/seeders/default_pipeline.py`).
 */

export const TENANT_ID = "11111111-1111-1111-1111-111111111111";
export const OWNER_ID = "22222222-2222-2222-2222-222222222222";

export const DEFAULT_PIPELINE_ID = "33333333-3333-3333-3333-333333333333";

export const STAGE_IDS = {
  new: "44444444-4444-4444-4444-440000000001",
  contacted: "44444444-4444-4444-4444-440000000002",
  qualified: "44444444-4444-4444-4444-440000000003",
  won: "44444444-4444-4444-4444-440000000004",
  lost: "44444444-4444-4444-4444-440000000005",
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

export const pipelinesFixture: Pipeline[] = [defaultPipelineFixture];
