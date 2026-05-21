import { formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Formato relativo "hace 3 horas" / "ayer" / "hace 2 días".
 *
 * Helper aislado del JSX para testear sin DOM. `date-fns` con locale es;
 * los locales catalán y portugués entran en Sprint 6 con `next-intl`.
 *
 * - Si `iso` es null/undefined → "—" (consistente con `formatMoney`).
 * - Si `iso` es inválido → "—" en lugar de "Invalid Date" o throw.
 * - `addSuffix: true` → añade "hace ".
 */
export function formatRelativeTime(
  iso: string | null | undefined,
): string {
  if (!iso) return "—";
  try {
    const date = parseISO(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  } catch {
    return "—";
  }
}

/**
 * Formato absoluto en es-ES: "21 may 2026, 09:30".
 */
export function formatAbsoluteTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const date = parseISO(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "—";
  }
}
