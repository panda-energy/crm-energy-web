import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Concatena clases Tailwind con `clsx` y resuelve conflictos con `tailwind-merge`.
 *
 * Esta es la utilidad estándar de shadcn/ui — todos los componentes copiados al
 * repo (`src/components/ui/*.tsx`) la importan. Si dos clases entran en conflicto
 * (p.ej. `px-2 px-4`), `tailwind-merge` se queda con la última. Esto es lo que
 * permite que un caller sobreescriba estilos vía la prop `className` sin
 * recurrir a `!important` ni `cx` artesanal.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
