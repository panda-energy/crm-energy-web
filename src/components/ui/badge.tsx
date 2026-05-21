import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Badge — etiqueta compacta de estado/etiquetado.
 *
 * Variants: `default` (brand), `secondary`, `outline`, `destructive`,
 * `success`, `warning`. Cubre los estados de Leads, ATR, Tickets que
 * llegarán en Sprint 2+.
 *
 * Todos los colores son tokens del design system.
 */
const badgeVariants = cva(
  cn(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  ),
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand text-brand-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border bg-transparent text-foreground",
        destructive: "border-transparent bg-danger text-danger-foreground",
        success: "border-transparent bg-success text-success-foreground",
        warning: "border-transparent bg-warning text-warning-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
