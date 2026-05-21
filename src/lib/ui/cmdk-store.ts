"use client";

import { create } from "zustand";

/**
 * Store global del Command Palette.
 *
 * Solo UI state — abrir/cerrar + hidratación inicial de recientes
 * (que vienen de localStorage). El contenido (búsqueda de leads /
 * pipelines) NO vive aquí: lo gestiona el componente con TanStack
 * Query directamente.
 *
 * Por qué Zustand y no useState local: el trigger (`⌘K`) debe poder
 * abrirlo desde cualquier punto del árbol (CommandPaletteTrigger en
 * topbar, command palette en cualquier acción global). Un store
 * compartido lo simplifica.
 */
interface CmdkState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useCmdkStore = create<CmdkState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}));
