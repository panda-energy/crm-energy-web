/**
 * Concatena className strings, ignorando falsies.
 *
 * No usa `clsx` ni `tailwind-merge` todavía (Sprint 2 los añadirá cuando los
 * componentes shadcn lo requieran). Pero la API es compatible para que la
 * migración sea trivial.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
