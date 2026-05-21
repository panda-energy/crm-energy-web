import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import {
  forwardRef,
  type ComponentProps,
  type ComponentPropsWithoutRef,
} from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Breadcrumb — patrón shadcn estándar.
 *
 * Composición:
 *   <Breadcrumb>
 *     <BreadcrumbList>
 *       <BreadcrumbItem>
 *         <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
 *       </BreadcrumbItem>
 *       <BreadcrumbSeparator />
 *       <BreadcrumbItem>
 *         <BreadcrumbPage>Leads</BreadcrumbPage>
 *       </BreadcrumbItem>
 *     </BreadcrumbList>
 *   </Breadcrumb>
 *
 * Accesibilidad: `<nav aria-label="breadcrumb">`, último ítem con
 * `aria-current="page"`. Separadores marcados como `aria-hidden`.
 */
export const Breadcrumb = forwardRef<
  HTMLElement,
  ComponentPropsWithoutRef<"nav">
>(function Breadcrumb({ ...props }, ref) {
  return <nav ref={ref} aria-label="breadcrumb" {...props} />;
});

export const BreadcrumbList = forwardRef<
  HTMLOListElement,
  ComponentPropsWithoutRef<"ol">
>(function BreadcrumbList({ className, ...props }, ref) {
  return (
    <ol
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
        className,
      )}
      {...props}
    />
  );
});

export const BreadcrumbItem = forwardRef<
  HTMLLIElement,
  ComponentPropsWithoutRef<"li">
>(function BreadcrumbItem({ className, ...props }, ref) {
  return (
    <li
      ref={ref}
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  );
});

export const BreadcrumbLink = forwardRef<
  HTMLAnchorElement,
  ComponentPropsWithoutRef<"a"> & { asChild?: boolean }
>(function BreadcrumbLink({ className, asChild, ...props }, ref) {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      ref={ref}
      className={cn(
        "rounded-sm transition-colors hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      {...props}
    />
  );
});

export const BreadcrumbPage = forwardRef<
  HTMLSpanElement,
  ComponentPropsWithoutRef<"span">
>(function BreadcrumbPage({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-medium text-foreground", className)}
      {...props}
    />
  );
});

export function BreadcrumbSeparator({
  children,
  className,
  ...props
}: ComponentProps<"li">) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}

export function BreadcrumbEllipsis({
  className,
  ...props
}: ComponentProps<"span">) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">Más</span>
    </span>
  );
}
