/**
 * Helpers puros para selección bulk en la tabla de leads (F-2.6).
 *
 * Aislados del JSX para tests Vitest. Cubren:
 *  - Merge de selección al cargar otra página (preserva selecciones
 *    previas que ahora no son visibles).
 *  - Conteo de "no visibles": cuántos IDs seleccionados no aparecen
 *    en la página actual (UX cross-filter: muestra "{M} no visibles
 *    con los filtros actuales").
 *  - Selección por rango shift+click sobre un array ordenado de IDs.
 */

/**
 * Une una selección previa con una nueva (no quita selecciones —
 * solo es relevante para razonar sobre dedupe). En la práctica el
 * store Zustand ya garantiza `Set` semántica; este helper se queda
 * por simetría con la suite de tests.
 */
export function mergeSelectionAcrossPages(
  previous: ReadonlySet<string>,
  visibleIds: ReadonlyArray<string>,
  picked: ReadonlyArray<string>,
): Set<string> {
  const next = new Set(previous);
  for (const id of picked) next.add(id);
  // Visible IDs entran en el cálculo solo si están en `picked`. Cualquier
  // ID no-visible que ya estuviera en `previous` se preserva.
  void visibleIds;
  return next;
}

/**
 * Cuántos IDs seleccionados NO aparecen en la página visible actual.
 * Se muestra al usuario como "{M} no visibles con los filtros actuales"
 * para que sepa que su selección persiste cross-filter.
 */
export function countSelectedNotVisible(
  selected: ReadonlySet<string>,
  visibleIds: ReadonlyArray<string>,
): number {
  if (selected.size === 0) return 0;
  const visible = new Set(visibleIds);
  let n = 0;
  for (const id of selected) {
    if (!visible.has(id)) n += 1;
  }
  return n;
}

/**
 * Resuelve el rango entre dos IDs en un array ordenado de IDs visibles.
 * Si alguno no está en el array devuelve `null`. El rango incluye ambos
 * extremos.
 *
 * Útil para shift+click: el caller pasa `anchorId` (último seleccionado)
 * y `targetId` (el del shift+click), y obtiene los IDs intermedios.
 */
export function resolveSelectionRange(
  orderedIds: ReadonlyArray<string>,
  anchorId: string,
  targetId: string,
): string[] | null {
  const a = orderedIds.indexOf(anchorId);
  const b = orderedIds.indexOf(targetId);
  if (a < 0 || b < 0) return null;
  const start = Math.min(a, b);
  const end = Math.max(a, b);
  return orderedIds.slice(start, end + 1);
}
