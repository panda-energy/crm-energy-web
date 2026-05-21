import { describe, expect, it } from "vitest";
import { addRecent, type CmdkRecent } from "./cmdk-recents";

const baseAction = (id: string, label: string): Omit<CmdkRecent, "lastUsedAt"> => ({
  id,
  label,
  kind: "action",
});

describe("addRecent", () => {
  it("añade item nuevo al frente", () => {
    const result = addRecent([], baseAction("action:create-lead", "Crear lead"));
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("action:create-lead");
    expect(result[0]!.lastUsedAt).toBeTruthy();
  });

  it("promueve item repetido al frente (dedupe)", () => {
    const initial: CmdkRecent[] = [
      { ...baseAction("a", "A"), lastUsedAt: "2026-01-01T00:00:00Z" },
      { ...baseAction("b", "B"), lastUsedAt: "2026-01-02T00:00:00Z" },
    ];
    const result = addRecent(initial, baseAction("a", "A actualizado"));
    expect(result.map((r) => r.id)).toEqual(["a", "b"]);
    expect(result[0]!.label).toBe("A actualizado");
  });

  it("capa a 5 items (descarta el más antiguo)", () => {
    let recents: CmdkRecent[] = [];
    for (let i = 0; i < 7; i++) {
      recents = addRecent(recents, baseAction(`a${i}`, `A${i}`));
    }
    expect(recents).toHaveLength(5);
    expect(recents.map((r) => r.id)).toEqual(["a6", "a5", "a4", "a3", "a2"]);
  });

  it("acepta items de tipo lead/pipeline con href", () => {
    const result = addRecent([], {
      id: "lead:abc",
      label: "María",
      kind: "lead",
      href: "/leads/abc",
      subtitle: "maria@ejemplo.com",
    });
    expect(result[0]!.href).toBe("/leads/abc");
    expect(result[0]!.subtitle).toBe("maria@ejemplo.com");
    expect(result[0]!.kind).toBe("lead");
  });
});
