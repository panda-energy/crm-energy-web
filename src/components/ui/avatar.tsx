"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Avatar — wrapper sobre Radix Avatar (`Avatar`, `AvatarImage`, `AvatarFallback`).
 *
 * Radix maneja el fallback automáticamente cuando la imagen falla o tarda.
 * Tamaño base 40×40 (`size-10`); ajustable con `className`.
 */
export const Avatar = forwardRef<
  ElementRef<typeof AvatarPrimitive.Root>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(function Avatar({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-full",
        className,
      )}
      {...props}
    />
  );
});

export const AvatarImage = forwardRef<
  ElementRef<typeof AvatarPrimitive.Image>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(function AvatarImage({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  );
});

export const AvatarFallback = forwardRef<
  ElementRef<typeof AvatarPrimitive.Fallback>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(function AvatarFallback({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium",
        className,
      )}
      {...props}
    />
  );
});
