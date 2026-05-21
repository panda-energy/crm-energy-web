"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Button — variante shadcn/ui adaptada a los tokens del design system de Panda.
 *
 * Convención:
 *  - Variants visuales: `default`, `secondary`, `outline`, `ghost`, `destructive`,
 *    `link`.
 *  - Sizes: `sm`, `md` (default), `lg`, `icon`.
 *  - `asChild` (Slot de Radix) permite renderizar como `<a>`, `<Link>`, etc.
 *  - Solo usa tokens (`bg-brand`, `text-foreground`, `border-border`...). Nada
 *    de colores Tailwind crudos.
 *  - Focus ring accesible vía token `--ring`.
 */
const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ),
  {
    variants: {
      variant: {
        default: "bg-brand text-brand-foreground hover:bg-brand/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/85",
        outline:
          "border border-input bg-background text-foreground hover:bg-muted hover:text-foreground",
        ghost: "bg-transparent text-foreground hover:bg-muted",
        destructive: "bg-danger text-danger-foreground hover:bg-danger/90",
        link: "bg-transparent text-brand underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, type, ...rest },
  ref,
) {
  if (asChild) {
    return (
      <Slot
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...rest}
      />
    );
  }
  return (
    <button
      ref={ref}
      // reason: por defecto los <button> dentro de <form> son submit; siempre
      // explícito para evitar bugs no obvios.
      type={type ?? "button"}
      className={cn(buttonVariants({ variant, size }), className)}
      {...rest}
    />
  );
});

export { buttonVariants };
