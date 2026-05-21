"use client";

import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";

/**
 * Command palette base — wrapper sobre `cmdk` con tokens del DS.
 *
 * Composición habitual:
 *
 *   <CommandDialog open={open} onOpenChange={setOpen}>
 *     <CommandInput placeholder="Buscar…" />
 *     <CommandList>
 *       <CommandEmpty>Sin resultados.</CommandEmpty>
 *       <CommandGroup heading="Acciones">
 *         <CommandItem onSelect={…}>Crear lead</CommandItem>
 *       </CommandGroup>
 *     </CommandList>
 *   </CommandDialog>
 *
 * Notas:
 *  - `cmdk` ya cubre teclado: flechas, Enter, Esc, type-to-search.
 *  - `<DialogTitle>` se monta visualmente oculto para que SR lo lea.
 *  - El portal lo provee el `Dialog` interno — el overlay aparece encima
 *    del layout.
 */

export const Command = forwardRef<
  ElementRef<typeof CommandPrimitive>,
  ComponentPropsWithoutRef<typeof CommandPrimitive>
>(function Command({ className, ...props }, ref) {
  return (
    <CommandPrimitive
      ref={ref}
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-md bg-surface text-surface-foreground",
        className,
      )}
      {...props}
    />
  );
});

interface CommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Label oculto para screen readers. */
  title?: string;
  children: React.ReactNode;
  /** Filtro custom (cmdk lo expone). Por defecto: matching fuzzy stock. */
  filter?: (value: string, search: string, keywords?: string[]) => number;
}

export function CommandDialog({
  open,
  onOpenChange,
  title = "Buscar y ejecutar acciones",
  children,
  filter,
}: CommandDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "overflow-hidden p-0 sm:max-w-xl",
          "data-[state=open]:animate-[var(--animate-in-scale)]",
        )}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <Command
          filter={filter}
          className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-item]]:py-2"
        >
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export const CommandInput = forwardRef<
  ElementRef<typeof CommandPrimitive.Input>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(function CommandInput({ className, ...props }, ref) {
  return (
    <div
      cmdk-input-wrapper=""
      className="flex items-center gap-2 border-b border-border px-3"
    >
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <CommandPrimitive.Input
        ref={ref}
        className={cn(
          "flex h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
});

export const CommandList = forwardRef<
  ElementRef<typeof CommandPrimitive.List>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(function CommandList({ className, ...props }, ref) {
  return (
    <CommandPrimitive.List
      ref={ref}
      className={cn(
        "max-h-[60vh] overflow-y-auto overflow-x-hidden",
        className,
      )}
      {...props}
    />
  );
});

export const CommandEmpty = forwardRef<
  ElementRef<typeof CommandPrimitive.Empty>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>(function CommandEmpty({ className, ...props }, ref) {
  return (
    <CommandPrimitive.Empty
      ref={ref}
      className={cn("py-6 text-center text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});

export const CommandGroup = forwardRef<
  ElementRef<typeof CommandPrimitive.Group>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(function CommandGroup({ className, ...props }, ref) {
  return (
    <CommandPrimitive.Group
      ref={ref}
      className={cn("py-1 text-foreground", className)}
      {...props}
    />
  );
});

export const CommandSeparator = forwardRef<
  ElementRef<typeof CommandPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(function CommandSeparator({ className, ...props }, ref) {
  return (
    <CommandPrimitive.Separator
      ref={ref}
      className={cn("mx-2 my-1 h-px bg-border", className)}
      {...props}
    />
  );
});

export const CommandItem = forwardRef<
  ElementRef<typeof CommandPrimitive.Item>,
  ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(function CommandItem({ className, ...props }, ref) {
  return (
    <CommandPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-md px-3 py-2 text-sm outline-none",
        "data-[selected=true]:bg-muted data-[selected=true]:text-foreground",
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

export function CommandShortcut({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "ml-auto text-[10px] tracking-widest text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
