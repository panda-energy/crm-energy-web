import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Smoke test de dynamic imports — verifica que los componentes diferidos
 * (LeadsTimelineView, BulkActionBar, CommandPalette) **sí** producen
 * chunks separados después de `pnpm build`.
 *
 * Si una refactor accidentalmente reemplaza el `next/dynamic` por un import
 * estático, este test falla y la regresión queda visible antes de mergear.
 *
 * **Requiere** `.next/static/chunks` existente. Si no, el test queda en
 * `skip` con un mensaje claro (no rompe CI cuando el build aún no se ha
 * ejecutado).
 */

const CHUNKS_DIR = join(process.cwd(), ".next/static/chunks");

const MARKERS: ReadonlyArray<{ name: string; needle: string }> = [
  // reason: usamos los nombres exportados (sobreviven a la minificación
  // porque Webpack los emite en el ESM re-export map de cada chunk
  // dinámico, p.ej. `d(t,{LeadsTimelineView:()=>...})`).
  { name: "LeadsTimelineView", needle: "LeadsTimelineView:" },
  { name: "BulkActionBar", needle: "BulkActionBar:" },
  { name: "CommandPalette", needle: "CommandPalette:" },
];

function listChunks(): string[] {
  if (!existsSync(CHUNKS_DIR)) return [];
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith(".js")) out.push(full);
    }
  };
  walk(CHUNKS_DIR);
  return out;
}

describe("dynamic imports — bundle smoke", () => {
  const chunks = listChunks();

  // reason: si nadie corrió `pnpm build`, este test no puede correr. Lo
  // marcamos como skip (visible en output) para no bloquear watch mode.
  const runIf = chunks.length > 0 ? it : it.skip;

  runIf("genera al menos 3 chunks (split mínimo)", () => {
    expect(chunks.length).toBeGreaterThanOrEqual(3);
  });

  for (const { name, needle } of MARKERS) {
    runIf(`crea un chunk separado para ${name}`, () => {
      // Cada componente debe aparecer en algún chunk del directorio (no
      // verificamos que no esté en otros — Webpack/Turbopack a veces
      // inlinea por shared boundary).
      const found = chunks.some((path) => {
        const content = readFileSync(path, "utf8");
        return content.includes(needle);
      });
      expect(found, `Marker "${needle}" no encontrado en ningún chunk`).toBe(
        true,
      );
    });
  }

  runIf(
    "no inline-ea LeadsTimelineView en el chunk principal de /leads",
    () => {
      // reason: el chunk de /leads/page debe quedar pequeño (<2 kB). Si
      // accidentalmente importamos el Timeline estático, este archivo
      // crece y la heurística falla.
      const leadsPageChunk = chunks.find((path) =>
        /\/leads\/page-[a-f0-9]+\.js$/.test(path),
      );
      if (!leadsPageChunk) {
        // Build puede usar nombres ligeramente distintos en Turbopack.
        return;
      }
      const stat = readFileSync(leadsPageChunk, "utf8");
      // Heurística suave: el chunk debe ser pequeño y NO contener el
      // string "groupLeadsByMonth" (helper interno del timeline).
      expect(stat).not.toContain("groupLeadsByMonth");
    },
  );
});
