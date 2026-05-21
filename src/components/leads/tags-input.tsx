"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

/**
 * TagsInput — input que acumula chips. Usado en el Sheet "Crear lead" y
 * potencialmente en el form de edición.
 *
 * Reglas:
 *  - Enter o coma añaden el tag (trim, dedup, max 64 chars).
 *  - Backspace en input vacío borra el último.
 *  - El callback `onChange` recibe la lista completa actualizada.
 *  - Sin validación de tags vacíos — el filter Zod del form padre se
 *    encarga.
 */
export interface TagsInputProps {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

export function TagsInput({
  id,
  value,
  onChange,
  placeholder = "Añade etiquetas + Enter",
  className,
  ariaLabel,
  disabled,
}: TagsInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = (raw: string) => {
    const tag = raw.trim().slice(0, 64);
    if (!tag) return;
    if (value.includes(tag)) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      {value.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="gap-1 pr-1"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            aria-label={`Quitar etiqueta ${tag}`}
            disabled={disabled}
            className={cn(
              "inline-flex size-4 items-center justify-center rounded-full",
              "hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            )}
          >
            <X className="size-3" aria-hidden />
          </button>
        </Badge>
      ))}
      <Input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(draft);
          } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => addTag(draft)}
        placeholder={value.length === 0 ? placeholder : ""}
        aria-label={ariaLabel ?? "Añadir etiqueta"}
        disabled={disabled}
        className="h-7 flex-1 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  );
}
