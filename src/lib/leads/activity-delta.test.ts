import { describe, expect, it } from "vitest";
import type { Activity } from "@/lib/api/hooks/use-leads";
import { extractActivityDelta } from "./activity-delta";

const base = {
  id: "33333333-3333-3333-3333-333333333333",
  lead_id: "11111111-1111-1111-1111-111111111111",
  actor_user_id: null,
  summary: null,
  occurred_at: "2026-05-21T10:00:00Z",
  created_at: "2026-05-21T10:00:00Z",
} satisfies Omit<Activity, "type" | "payload">;

describe("extractActivityDelta", () => {
  it("extrae from/to en stage_changed", () => {
    const delta = extractActivityDelta({
      ...base,
      type: "stage_changed",
      payload: {
        from_stage_id: "aaaa-bbbb",
        to_stage_id: "cccc-dddd",
      },
    });
    expect(delta).toEqual({
      type: "stage_changed",
      fromStageId: "aaaa-bbbb",
      toStageId: "cccc-dddd",
      note: null,
    });
  });

  it("extrae note opcional en stage_changed", () => {
    const delta = extractActivityDelta({
      ...base,
      type: "stage_changed",
      payload: {
        from_stage_id: "aaaa",
        to_stage_id: "bbbb",
        note: "Pasado a cualificado tras llamada",
      },
    });
    expect(delta).toMatchObject({ note: "Pasado a cualificado tras llamada" });
  });

  it("extrae status_changed", () => {
    const delta = extractActivityDelta({
      ...base,
      type: "status_changed",
      payload: { from_status: "new", to_status: "contacted" },
    });
    expect(delta).toEqual({
      type: "status_changed",
      fromStatus: "new",
      toStatus: "contacted",
    });
  });

  it("devuelve null para tipos no soportados", () => {
    expect(
      extractActivityDelta({
        ...base,
        type: "note",
        payload: {},
      }),
    ).toBeNull();
  });

  it("devuelve null si el payload no tiene los campos esperados", () => {
    const delta = extractActivityDelta({
      ...base,
      type: "stage_changed",
      payload: {},
    });
    // Devolvemos el shape igual aunque con nulls dentro (UI sabe lidiar).
    expect(delta).toEqual({
      type: "stage_changed",
      fromStageId: null,
      toStageId: null,
      note: null,
    });
  });
});
