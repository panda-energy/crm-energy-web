import { describe, expect, it } from "vitest";
import { ACTIVITY_FIXTURES } from "@/mocks/fixtures/activities";
import { LEAD_FIXTURES } from "@/mocks/fixtures/leads";
import {
  allStagesFixture,
  pipelinesFixture,
} from "@/mocks/fixtures/pipelines";
import { usersFixture } from "@/mocks/fixtures/users";

/**
 * Integridad referencial de las fixtures MSW (commit d9b4e70: 50 leads,
 * 8 users, 2 pipelines, 100+ activities).
 *
 * Por qué este test existe: una fixture con `pipeline_id`/`stage_id`/
 * `owner_id` huérfano pasa la validación Zod por separado (los IDs son
 * UUIDs válidos) pero rompe la UI en `usePipelineStages()` / kanban / map
 * de propietarios. Si alguien añade leads o activities en futuras
 * iteraciones, este test atrapa la inconsistencia antes del runtime.
 */
describe("MSW fixtures — integridad referencial", () => {
  const pipelineIds = new Set(pipelinesFixture.map((p) => p.id));
  const stageIds = new Set(allStagesFixture.map((s) => s.id));
  const stageByIdMap = new Map(allStagesFixture.map((s) => [s.id, s]));
  const userIds = new Set(usersFixture.map((u) => u.id));
  const leadIds = new Set(LEAD_FIXTURES.map((l) => l.id));

  it("todos los pipeline_id de leads existen en pipelinesFixture", () => {
    const orphans = LEAD_FIXTURES.filter(
      (l) => !pipelineIds.has(l.pipeline_id),
    ).map((l) => `${l.id}→${l.pipeline_id}`);
    expect(orphans).toEqual([]);
  });

  it("todos los stage_id de leads existen y pertenecen al pipeline del lead", () => {
    const bad: string[] = [];
    for (const l of LEAD_FIXTURES) {
      if (!stageIds.has(l.stage_id)) {
        bad.push(`${l.id}: stage_id ${l.stage_id} no existe`);
        continue;
      }
      const stage = stageByIdMap.get(l.stage_id);
      if (stage && stage.pipeline_id !== l.pipeline_id) {
        bad.push(
          `${l.id}: stage ${l.stage_id} pertenece a ${stage.pipeline_id} pero lead.pipeline_id = ${l.pipeline_id}`,
        );
      }
    }
    expect(bad).toEqual([]);
  });

  it("status `won`/`lost` solo aparece en stages con is_won/is_lost coherente", () => {
    const bad: string[] = [];
    for (const l of LEAD_FIXTURES) {
      const stage = stageByIdMap.get(l.stage_id);
      if (!stage) continue;
      if (l.status === "won" && !stage.is_won)
        bad.push(`${l.id}: status=won pero stage.is_won=false`);
      if (l.status === "lost" && !stage.is_lost)
        bad.push(`${l.id}: status=lost pero stage.is_lost=false`);
    }
    expect(bad).toEqual([]);
  });

  it("todos los owner_id de leads (cuando no es null) existen en usersFixture", () => {
    const orphans = LEAD_FIXTURES.filter(
      (l) => l.owner_id !== null && !userIds.has(l.owner_id),
    ).map((l) => `${l.id}→${l.owner_id}`);
    expect(orphans).toEqual([]);
  });

  it("todos los lead_id de activities existen en LEAD_FIXTURES", () => {
    const orphans = ACTIVITY_FIXTURES.filter(
      (a) => !leadIds.has(a.lead_id),
    ).map((a) => `${a.id}→${a.lead_id}`);
    expect(orphans).toEqual([]);
  });

  it("todos los actor_user_id de activities (cuando no es null) existen en usersFixture", () => {
    const orphans = ACTIVITY_FIXTURES.filter(
      (a) => a.actor_user_id !== null && !userIds.has(a.actor_user_id),
    ).map((a) => `${a.id}→${a.actor_user_id}`);
    expect(orphans).toEqual([]);
  });

  it("los IDs de activities son únicos", () => {
    const seen = new Set<string>();
    const dups: string[] = [];
    for (const a of ACTIVITY_FIXTURES) {
      if (seen.has(a.id)) dups.push(a.id);
      seen.add(a.id);
    }
    expect(dups).toEqual([]);
  });

  it("LEAD_FIXTURES tiene exactamente 50 entradas", () => {
    expect(LEAD_FIXTURES).toHaveLength(50);
  });
});
