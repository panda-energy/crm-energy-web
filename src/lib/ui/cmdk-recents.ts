/**
 * Gestor de "recientes" del Command Palette.
 *
 * Persistido en `localStorage` (clave `panda.cmdk.recents`). Cap a 5
 * ítems. Cuando un item se repite, sube a la cabeza (Stack).
 *
 * Aislado del JSX para tests puros con Vitest.
 */
const STORAGE_KEY = "panda.cmdk.recents";
const MAX_ITEMS = 5;

export interface CmdkRecent {
  /** Identifier estable. Para acciones: `action:create-lead`. Para leads: `lead:UUID`. */
  id: string;
  label: string;
  /** Subtítulo opcional (email, empresa, etc.). */
  subtitle?: string;
  /** Tipo de item — para iconos/routing. */
  kind: "action" | "lead" | "pipeline";
  /** Href para navegación (si aplica). */
  href?: string;
  /** Timestamp ISO de la última selección. */
  lastUsedAt: string;
}

export function addRecent(
  current: ReadonlyArray<CmdkRecent>,
  item: Omit<CmdkRecent, "lastUsedAt">,
): CmdkRecent[] {
  const now = new Date().toISOString();
  const enriched: CmdkRecent = { ...item, lastUsedAt: now };
  // Dedup por id, manteniendo el orden recién-promovido al frente.
  const filtered = current.filter((r) => r.id !== item.id);
  return [enriched, ...filtered].slice(0, MAX_ITEMS);
}

export function loadRecents(): CmdkRecent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (it): it is CmdkRecent =>
          typeof it === "object" &&
          it !== null &&
          typeof (it as CmdkRecent).id === "string" &&
          typeof (it as CmdkRecent).label === "string" &&
          typeof (it as CmdkRecent).kind === "string",
      )
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function saveRecents(items: ReadonlyArray<CmdkRecent>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage quota / SSR / private mode: silenciamos. La UX no se
    // rompe — simplemente no quedará en recientes la próxima sesión.
  }
}

export function clearRecents(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export const __TESTONLY__ = { STORAGE_KEY, MAX_ITEMS };
