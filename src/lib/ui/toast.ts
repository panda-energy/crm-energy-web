"use client";

import { toast as sonnerToast, type ExternalToast } from "sonner";

/**
 * Wrapper sobre sonner con la API estándar de Panda.
 *
 * Convenciones de uso:
 *  - `toast.success(msg)` — confirmaciones de acción completada (creado,
 *    guardado, enviado).
 *  - `toast.info(msg)` — info no crítica que se descarta sola.
 *  - `toast.warning(msg)` — atención necesaria pero no error.
 *  - `toast.error(msg)` — el backend falló o la validación rechazó. Aria-live
 *    `assertive` para anunciar.
 *  - `toast.action(msg, { actionLabel, onAction })` — undo pattern (6s
 *    default). Usado por `useApiMutation`.
 *
 * Para errores PERSISTENTES (estado de sistema, multi-tenancy mismatch) usar
 * Banner, no toast. Para confirmaciones críticas usar `<Dialog>`.
 *
 * El icono lo provee sonner según el tipo. El estilo (colores) viene del
 * `<Toaster>` configurado en `components/ui/toaster.tsx` con tokens.
 */

interface BaseOptions {
  description?: string;
  id?: string | number;
  duration?: number;
}

interface ActionOptions extends BaseOptions {
  actionLabel: string;
  onAction: () => void | Promise<void>;
}

export const toast = {
  success(message: string, options: BaseOptions = {}): string | number {
    return sonnerToast.success(message, options);
  },

  info(message: string, options: BaseOptions = {}): string | number {
    return sonnerToast.info(message, options);
  },

  warning(message: string, options: BaseOptions = {}): string | number {
    return sonnerToast.warning(message, options);
  },

  error(message: string, options: BaseOptions = {}): string | number {
    return sonnerToast.error(message, {
      ...options,
      // reason: errores deben anunciarse a SR como assertive para que
      // interrumpan otra lectura en curso. Sonner usa `aria-live` interno.
    });
  },

  /**
   * Toast con acción undo. Default 6s — coincide con la regla cross-skill
   * de optimistic UI + undo. Ejecutar `onAction` cierra el toast.
   */
  action(message: string, options: ActionOptions): string | number {
    const { actionLabel, onAction, duration = 6000, ...rest } = options;
    const opts: ExternalToast = {
      ...rest,
      duration,
      action: {
        label: actionLabel,
        onClick: () => {
          void onAction();
        },
      },
    };
    return sonnerToast(message, opts);
  },

  /** Cierra un toast por id. */
  dismiss(id?: string | number): void {
    sonnerToast.dismiss(id);
  },
};
