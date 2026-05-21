"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Sheet — drawer lateral (top/bottom/left/right) basado en Radix Dialog.
 *
 * Decisión vs `Drawer` (vaul):
 *  - El backlog (AGENT.md) habla de "Drawer" como concepto UX, pero en web
 *    shadcn modela ese patrón con `Sheet` (Radix Dialog parametrizado por
 *    `side`). Es lo que vamos a usar en CRM para:
 *      · sidebar colapsable mobile (F-1.5)
 *      · panel lateral de detalle de Lead (F-2.4)
 *      · paneles auxiliares en general.
 *  - `vaul` (instalado) se reserva para el portal cliente final (F-5.7+)
 *    donde queremos el drag-to-dismiss tipo iOS Safari. En esos casos
 *    crearemos `src/components/ui/drawer.tsx` aparte.
 *
 * Composición igual que Dialog:
 *   <Sheet open={...} onOpenChange={...}>
 *     <SheetTrigger>...</SheetTrigger>
 *     <SheetContent side="right">
 *       <SheetHeader>
 *         <SheetTitle>...</SheetTitle>
 *         <SheetDescription>...</SheetDescription>
 *       </SheetHeader>
 *       ...
 *     </SheetContent>
 *   </Sheet>
 */
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

export const SheetOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function SheetOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm",
        "data-[state=open]:animate-[var(--animate-in-fade)] data-[state=closed]:animate-[var(--animate-out-fade)]",
        className,
      )}
      {...props}
    />
  );
});

const sheetVariants = cva(
  cn(
    "fixed z-50 gap-4 bg-surface text-surface-foreground shadow-4 transition ease-in-out",
    "focus:outline-none",
  ),
  {
    variants: {
      side: {
        top: cn(
          "inset-x-0 top-0 border-b border-border",
          "data-[state=open]:animate-[var(--animate-slide-in-bottom)_reverse] data-[state=closed]:animate-[var(--animate-slide-out-bottom)_reverse]",
        ),
        bottom: cn(
          "inset-x-0 bottom-0 border-t border-border",
          "data-[state=open]:animate-[var(--animate-slide-in-bottom)] data-[state=closed]:animate-[var(--animate-slide-out-bottom)]",
        ),
        left: cn(
          "inset-y-0 left-0 h-full w-3/4 border-r border-border sm:max-w-sm",
          "data-[state=open]:animate-[var(--animate-slide-in-right)_reverse] data-[state=closed]:animate-[var(--animate-slide-out-right)_reverse]",
        ),
        right: cn(
          "inset-y-0 right-0 h-full w-3/4 border-l border-border sm:max-w-sm",
          "data-[state=open]:animate-[var(--animate-slide-in-right)] data-[state=closed]:animate-[var(--animate-slide-out-right)]",
        ),
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

export interface SheetContentProps
  extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

export const SheetContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(function SheetContent({ className, side = "right", children, ...props }, ref) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(sheetVariants({ side }), "p-6", className)}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className={cn(
            "absolute right-4 top-4 rounded-sm opacity-70 transition-opacity",
            "hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
            "disabled:pointer-events-none",
          )}
        >
          <X className="size-4" aria-hidden />
          <span className="sr-only">Cerrar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </SheetPortal>
  );
});

export function SheetHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        className,
      )}
      {...props}
    />
  );
}

export function SheetFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

export const SheetTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function SheetTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  );
});

export const SheetDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function SheetDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
