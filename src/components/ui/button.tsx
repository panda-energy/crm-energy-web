import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Button base. Versión mínima copiada al repo (estilo shadcn — NO dependencia).
 *
 * Sprint 2 ampliará variants/sizes con `class-variance-authority`. Por ahora
 * sirve para sembrar la convención: componentes vivien en src/components/ui/,
 * importan tokens vía clases Tailwind semánticas, accesibles por defecto.
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-brand text-brand-foreground hover:opacity-90",
  secondary: "bg-secondary text-secondary-foreground hover:opacity-90",
  ghost: "bg-transparent text-foreground hover:bg-muted",
  danger: "bg-danger text-danger-foreground hover:opacity-90",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className, type, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      // reason: por defecto los <button> dentro de <form> son submit; siempre
      // explícito para evitar bugs no obvios.
      type={type ?? "button"}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-opacity",
        "disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        variantClasses[variant],
        className,
      )}
      {...rest}
    />
  );
});
