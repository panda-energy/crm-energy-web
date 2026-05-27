"use client";

import { create } from "zustand";

/**
 * Store global del AI Chat panel.
 *
 * Solo UI state -- abrir/cerrar. El contenido del chat (mensajes, envio)
 * lo gestiona TanStack Query via los hooks de use-chat.ts.
 *
 * Similar al cmdk-store: permite abrir desde topbar, shortcut, o
 * cualquier punto del arbol.
 */
interface ChatPanelState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  /** Pending tool calls count for badge in topbar */
  pendingCount: number;
  setPendingCount: (count: number) => void;
}

export const useChatStore = create<ChatPanelState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
  pendingCount: 0,
  setPendingCount: (count) => set({ pendingCount: count }),
}));
