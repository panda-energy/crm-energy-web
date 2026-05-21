"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Label — wrapper sobre Radix Label.
 *
 * Radix garantiza que el `htmlFor` apunte al control asociado y maneja
 * el comportamiento de click → focus. Cumple WCAG 2.4.6 + 1.3.1.
 */
export const Label = forwardRef<
  ElementRef<typeof LabelPrimitive.Root>,
  ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(function Label({ className, ...props }, ref) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none text-foreground",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
});
