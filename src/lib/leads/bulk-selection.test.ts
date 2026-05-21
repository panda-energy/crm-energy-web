import { describe, expect, it } from "vitest";
import {
  countSelectedNotVisible,
  mergeSelectionAcrossPages,
  resolveSelectionRange,
} from "./bulk-selection";

describe("mergeSelectionAcrossPages", () => {
  it("añade picked al set existente", () => {
    const prev = new Set(["a", "b"]);
    const next = mergeSelectionAcrossPages(prev, ["c", "d", "e"], ["d", "e"]);
    expect([...next].sort()).toEqual(["a", "b", "d", "e"]);
  });

  it("dedupe: pick repetido no duplica", () => {
    const prev = new Set(["a"]);
    const next = mergeSelectionAcrossPages(prev, ["a", "b"], ["a", "b"]);
    expect([...next].sort()).toEqual(["a", "b"]);
  });
});

describe("countSelectedNotVisible", () => {
  it("cuenta IDs seleccionados ausentes de la página", () => {
    const selected = new Set(["a", "b", "c", "d"]);
    expect(countSelectedNotVisible(selected, ["a", "b"])).toBe(2);
  });

  it("0 si todos los seleccionados están visibles", () => {
    const selected = new Set(["a", "b"]);
    expect(countSelectedNotVisible(selected, ["a", "b", "c"])).toBe(0);
  });

  it("0 si la selección está vacía", () => {
    expect(countSelectedNotVisible(new Set(), ["a", "b"])).toBe(0);
  });
});

describe("resolveSelectionRange", () => {
  const ids = ["a", "b", "c", "d", "e"];

  it("incluye ambos extremos", () => {
    expect(resolveSelectionRange(ids, "b", "d")).toEqual(["b", "c", "d"]);
  });

  it("acepta orden inverso (target antes que anchor)", () => {
    expect(resolveSelectionRange(ids, "d", "b")).toEqual(["b", "c", "d"]);
  });

  it("mismo ID → array con un solo elemento", () => {
    expect(resolveSelectionRange(ids, "c", "c")).toEqual(["c"]);
  });

  it("ID no presente → null", () => {
    expect(resolveSelectionRange(ids, "z", "c")).toBeNull();
    expect(resolveSelectionRange(ids, "c", "z")).toBeNull();
  });
});
