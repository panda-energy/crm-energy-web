import type esMessages from "./messages/es.json";

/**
 * Locale type -- the three supported locales for the CRM chrome.
 */
export type Locale = "es" | "ca" | "pt";

/**
 * Message structure inferred from the Spanish (source) JSON.
 * All locale files must conform to this shape.
 */
export type Messages = typeof esMessages;

/**
 * Flattened key path for type-safe `t()` usage.
 * Example: "nav.dashboard", "actions.save", "statuses.new"
 */
export type MessageKey = FlattenKeys<Messages>;

// -- Utility: flatten nested object keys with dot notation --

type FlattenKeys<T, Prefix extends string = ""> = T extends Record<
  string,
  unknown
>
  ? {
      [K in keyof T & string]: T[K] extends Record<string, unknown>
        ? FlattenKeys<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;
