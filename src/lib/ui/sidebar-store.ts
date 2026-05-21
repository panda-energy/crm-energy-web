"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * UI state del sidebar del CRM.
 *
 * Regla técnica #3: Zustand para UI state. Persistido en localStorage para
 * que el dev sienta que el colapso "se respeta" entre recargas. La preferencia
 * vive solo en el cliente — no se sincroniza con backend.
 *
 * Solo el sidebar de DESKTOP. El sidebar móvil se gestiona con el estado
 * controlado del `Sheet` desde el propio componente.
 */
interface SidebarState {
  /** True = sidebar colapsado (solo iconos). False = expandido. */
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => set((s) => ({ collapsed: !s.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed }),
    }),
    { name: "panda.ui.sidebar" },
  ),
);
