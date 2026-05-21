import { describe, expect, it } from "vitest";
import { matchEvent, parseCombo } from "./use-global-shortcut";

/**
 * Tests puros del matching de combo + platform. NO renderizamos el hook;
 * la lógica del listener es trivial y la cobertura crítica está en la
 * función `matchEvent`.
 */
function makeKeyEvent(init: Partial<KeyboardEventInit>): KeyboardEvent {
  return new KeyboardEvent("keydown", { key: "k", ...init });
}

describe("parseCombo", () => {
  it("parsea mod+k", () => {
    expect(parseCombo("mod+k")).toEqual({
      key: "k",
      mod: true,
      shift: false,
      alt: false,
    });
  });

  it("parsea ctrl+shift+p", () => {
    expect(parseCombo("ctrl+shift+p")).toEqual({
      key: "p",
      mod: true,
      shift: true,
      alt: false,
    });
  });

  it("ignora espacios y mayúsculas", () => {
    expect(parseCombo(" MOD + K ")).toEqual({
      key: "k",
      mod: true,
      shift: false,
      alt: false,
    });
  });
});

describe("matchEvent — plataforma Mac", () => {
  const combo = parseCombo("mod+k");

  it("acepta ⌘+K en Mac", () => {
    const ev = makeKeyEvent({ key: "k", metaKey: true });
    expect(matchEvent(ev, combo, true)).toBe(true);
  });

  it("rechaza Ctrl+K en Mac (solo ⌘ es 'mod')", () => {
    const ev = makeKeyEvent({ key: "k", ctrlKey: true });
    expect(matchEvent(ev, combo, true)).toBe(false);
  });

  it("rechaza K sin modificador", () => {
    const ev = makeKeyEvent({ key: "k" });
    expect(matchEvent(ev, combo, true)).toBe(false);
  });

  it("rechaza ⌘+Shift+K si el combo no incluye Shift", () => {
    const ev = makeKeyEvent({ key: "k", metaKey: true, shiftKey: true });
    expect(matchEvent(ev, combo, true)).toBe(false);
  });
});

describe("matchEvent — plataforma no-Mac (Linux/Windows)", () => {
  const combo = parseCombo("mod+k");

  it("acepta Ctrl+K en Linux", () => {
    const ev = makeKeyEvent({ key: "k", ctrlKey: true });
    expect(matchEvent(ev, combo, false)).toBe(true);
  });

  it("rechaza ⌘+K en Linux (Meta no es 'mod' fuera de Mac)", () => {
    const ev = makeKeyEvent({ key: "k", metaKey: true });
    expect(matchEvent(ev, combo, false)).toBe(false);
  });
});
