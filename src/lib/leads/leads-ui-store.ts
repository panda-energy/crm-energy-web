"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * UI state local de la página `/leads`.
 *
 * Regla técnica #3: Zustand SOLO para UI state, nunca para server state. Aquí
 * vive:
 *  - `selectedIds`: selección actual de filas para bulk actions (Wave 2).
 *  - `filtersCollapsed`: estado del sidebar de filtros (persistido).
 *
 * Los filtros propiamente dichos (status, source, q, etc.) viven en
 * `searchParams` de la URL (shareable + back-button funcional), NO aquí.
 *
 * Solo la selección se mantiene en memoria — meterla en URL haría ruido
 * inmenso (UUIDs en query string).
 */
interface LeadsUiState {
  /** IDs seleccionados para bulk actions. `Set` para deduplicación rápida. */
  selectedIds: Set<string>;
  /** True = filtros visibles. False = colapsados a la izquierda. */
  filtersCollapsed: boolean;

  toggleSelection: (id: string) => void;
  selectMany: (ids: string[]) => void;
  unselectMany: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;

  toggleFilters: () => void;
  setFiltersCollapsed: (collapsed: boolean) => void;
}

/**
 * reason: zustand `persist` no serializa `Set` por defecto. Convertimos a
 * array al persistir y restauramos al hidratar; `partialize` solo guarda
 * `filtersCollapsed` (la selección no debe sobrevivir refresh — sería
 * confuso).
 */
export const useLeadsUiStore = create<LeadsUiState>()(
  persist(
    (set, get) => ({
      selectedIds: new Set<string>(),
      filtersCollapsed: false,

      toggleSelection: (id) =>
        set((s) => {
          const next = new Set(s.selectedIds);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return { selectedIds: next };
        }),
      selectMany: (ids) =>
        set((s) => {
          const next = new Set(s.selectedIds);
          for (const id of ids) next.add(id);
          return { selectedIds: next };
        }),
      unselectMany: (ids) =>
        set((s) => {
          const next = new Set(s.selectedIds);
          for (const id of ids) next.delete(id);
          return { selectedIds: next };
        }),
      clearSelection: () => set({ selectedIds: new Set() }),
      isSelected: (id) => get().selectedIds.has(id),

      toggleFilters: () =>
        set((s) => ({ filtersCollapsed: !s.filtersCollapsed })),
      setFiltersCollapsed: (collapsed) => set({ filtersCollapsed: collapsed }),
    }),
    {
      name: "panda.ui.leads",
      // Solo persistimos la preferencia de colapso. La selección se resetea
      // en cada session por diseño.
      partialize: (state) => ({ filtersCollapsed: state.filtersCollapsed }),
    },
  ),
);
