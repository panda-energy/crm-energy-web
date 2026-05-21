"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Tooltip — wrapper sobre Radix Tooltip con tokens del DS.
 *
 * Composición:
 *   <Tooltip>
 *     <TooltipTrigger asChild>
 *       <Button>Acción</Button>
 *     </TooltipTrigger>
 *     <TooltipContent>Texto del tooltip</TooltipContent>
 *   </Tooltip>
 *
 * Provider:
 *   `<TooltipProvider delayDuration={200} skipDelayDuration={0}>` se monta
 *   una vez en `app/providers.tsx`. No es necesario envolver cada Tooltip.
 *
 * Accesibilidad:
 *  - Radix añade `role="tooltip"` + `aria-describedby` automáticamente.
 *  - El trigger necesita un elemento focuseable (Button, Link…). Si el
 *    elemento envoltura no lo es, hay que añadir `tabIndex={0}`.
 *  - El texto del tooltip NO debe duplicar el label del trigger — debería
 *    ser información complementaria.
 *
 * Casos en CRM:
 *  - Indicadores en columnas no-sortables de la tabla de leads (sustituye
 *    al `title=` provisional de Wave 1).
 *  - Shortcuts (`⌘K`) en botones que abren cmd-k.
 *  - Iconos sin label visible en headers de columna Kanban.
 */
export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = forwardRef<
  ElementRef<typeof TooltipPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(function TooltipContent(
  { className, sideOffset = 4, ...props },
  ref,
) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-50 max-w-xs rounded-md border border-border bg-foreground px-2.5 py-1.5 text-xs text-background shadow-2",
          "data-[state=delayed-open]:animate-[var(--animate-in-fade)] data-[state=closed]:animate-[var(--animate-out-fade)]",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
});
