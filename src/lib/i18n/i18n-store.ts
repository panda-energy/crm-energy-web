import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "./types";

/**
 * Zustand store for UI locale preference.
 *
 * Persisted to localStorage so the user's choice survives reloads.
 * Default: "es" (Spanish). Supported: "es", "ca", "pt".
 */
interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: "es",
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "panda-i18n",
    },
  ),
);
