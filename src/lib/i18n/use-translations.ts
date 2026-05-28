"use client";

import { useCallback } from "react";
import type { Locale, Messages, MessageKey } from "./types";
import { useI18nStore } from "./i18n-store";
import esMessages from "./messages/es.json";
import caMessages from "./messages/ca.json";
import ptMessages from "./messages/pt.json";

const MESSAGES: Record<Locale, Messages> = {
  es: esMessages,
  ca: caMessages as Messages,
  pt: ptMessages as Messages,
};

/**
 * Get a nested value from an object by dot-separated key path.
 * Example: getNestedValue({ nav: { dashboard: "Dashboard" } }, "nav.dashboard") => "Dashboard"
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return path;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : path;
}

/**
 * Hook for translating chrome strings (sidebar, topbar, buttons, states).
 *
 * Returns `t(key)` function and the current `locale`.
 *
 * Usage:
 *   const { t, locale } = useTranslations();
 *   t("nav.dashboard") // => "Dashboard" or "Tauler" etc.
 */
export function useTranslations() {
  const locale = useI18nStore((s) => s.locale);
  const messages = MESSAGES[locale];

  const t = useCallback(
    (key: MessageKey): string => {
      return getNestedValue(messages as unknown as Record<string, unknown>, key);
    },
    [messages],
  );

  return { t, locale } as const;
}

/**
 * Non-hook helper for server contexts or static usage.
 * Accepts an explicit locale.
 */
export function translate(key: MessageKey, locale: Locale = "es"): string {
  const messages = MESSAGES[locale];
  return getNestedValue(messages as unknown as Record<string, unknown>, key);
}
