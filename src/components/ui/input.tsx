import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Input — wrapper shadcn/ui sobre `<input>` con tokens del design system.
 *
 * - Usa `bg-background`, `border-input`, `text-foreground`. Nada hardcoded.
 * - Focus ring accesible (token `--ring`).
 * - File inputs estilizados consistentemente.
 * - El consumidor SIEMPRE debe envolver con `<label>` o pasar `aria-label`
 *   para cumplir WCAG 2.2 AA (no se enforce aquí porque el `<Label>` viene
 *   aparte cuando lo necesitemos).
 */
export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground",
        "placeholder:text-muted-foreground",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger",
        className,
      )}
      {...props}
    />
  );
});
