"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Popover — wrapper sobre Radix Popover.
 *
 * Composición:
 *   <Popover>
 *     <PopoverTrigger asChild><Button>Abrir</Button></PopoverTrigger>
 *     <PopoverContent>...</PopoverContent>
 *   </Popover>
 *
 * Usado en filtros multi-select de la tabla de leads (F-2.1) para no
 * inflar el sidebar con dropdowns siempre abiertos.
 */
export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export const PopoverContent = forwardRef<
  ElementRef<typeof PopoverPrimitive.Content>,
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(function PopoverContent(
  { className, align = "start", sideOffset = 4, ...props },
  ref,
) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-md border border-border bg-surface p-3 text-surface-foreground shadow-3",
          "data-[state=open]:animate-[var(--animate-in-fade)] data-[state=closed]:animate-[var(--animate-out-fade)]",
          "focus:outline-none",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
