"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Checkbox — wrapper sobre Radix Checkbox con soporte para estado
 * indeterminado (útil para "seleccionar todos" parcial en tablas).
 *
 * Composición:
 *   <Checkbox checked={...} onCheckedChange={...} aria-label="Seleccionar fila" />
 *
 * Accesibilidad: Radix añade role="checkbox", aria-checked y maneja teclado.
 * El consumidor DEBE pasar `aria-label` o `aria-labelledby` cuando no haya
 * `<Label>` asociado visualmente.
 */
export const Checkbox = forwardRef<
  ElementRef<typeof CheckboxPrimitive.Root>,
  ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(function Checkbox({ className, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer flex size-4 shrink-0 items-center justify-center rounded-sm border border-input bg-background",
        "ring-offset-background transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=checked]:text-brand-foreground",
        "data-[state=indeterminate]:border-brand data-[state=indeterminate]:bg-brand data-[state=indeterminate]:text-brand-foreground",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        {/* reason: Radix expone `data-state=indeterminate` cuando `checked === 'indeterminate'`.
            Renderizamos icono distinto para que el SR (vía aria-checked="mixed") y
            la vista coincidan. */}
        {props.checked === "indeterminate" ? (
          <Minus className="size-3" aria-hidden />
        ) : (
          <Check className="size-3" aria-hidden />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
