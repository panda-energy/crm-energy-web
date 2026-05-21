"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Dialog — wrapper sobre Radix Dialog.
 *
 * Nota terminológica: el backlog F-1.11 lo llama "Modal"; shadcn/Radix lo
 * llaman "Dialog". Mantenemos el nombre shadcn (`Dialog`) para alinear con
 * la convención upstream y permitir copiar/pegar ejemplos de la docs. El
 * término "Modal" se usa en producto / UX docs cuando hablamos de la
 * superficie funcional.
 *
 * Composición:
 *   <Dialog open={...} onOpenChange={...}>
 *     <DialogTrigger>...</DialogTrigger>
 *     <DialogContent>
 *       <DialogHeader>
 *         <DialogTitle>...</DialogTitle>
 *         <DialogDescription>...</DialogDescription>
 *       </DialogHeader>
 *       ...
 *       <DialogFooter>
 *         <Button>...</Button>
 *       </DialogFooter>
 *     </DialogContent>
 *   </Dialog>
 *
 * Accesibilidad: Radix maneja focus trap, ESC, click-outside, aria-modal,
 * y exige `<DialogTitle>` para lectores de pantalla (si no quieres que se
 * vea, envuélvelo con `<VisuallyHidden>` desde Radix).
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...props }, ref) {
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

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(function DialogContent({ className, children, ...props }, ref) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4",
          "rounded-lg border border-border bg-surface p-6 text-surface-foreground shadow-4",
          "data-[state=open]:animate-[var(--animate-in-scale)] data-[state=closed]:animate-[var(--animate-out-scale)]",
          "focus:outline-none",
          className,
        )}
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
    </DialogPortal>
  );
});

export function DialogHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 text-center sm:text-left",
        className,
      )}
      {...props}
    />
  );
}

export function DialogFooter({
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

export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className,
      )}
      {...props}
    />
  );
});

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
