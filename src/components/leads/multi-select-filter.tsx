"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils/cn";

/**
 * MultiSelectFilter — selector multi-valor compacto, optimizado para uso
 * en el sidebar de filtros de Leads (F-2.1).
 *
 * Forma genérica `T extends string` — el caller pasa opciones tipadas
 * (LeadStatus, LeadSource, UUIDs de pipelines…).
 *
 * UX:
 *  - Trigger: nombre + contador "(N)" si hay selecciones.
 *  - Popover con lista de checkboxes (accesible con teclado).
 *  - Botón "Borrar" inline cuando hay alguna selección.
 *  - Sin búsqueda interna (lista corta, max 7 valores en nuestros casos).
 *    Para listas largas (tags) creamos otro componente.
 */
export interface MultiSelectOption<T extends string> {
  value: T;
  label: string;
  /** Pequeño preview color para status (opcional). */
  hint?: React.ReactNode;
}

export interface MultiSelectFilterProps<T extends string> {
  label: string;
  options: ReadonlyArray<MultiSelectOption<T>>;
  selected: T[];
  onChange: (next: T[]) => void;
  /** Mensaje cuando no hay opciones (lista vacía → propósito explicativo). */
  emptyText?: string;
  /** Deshabilita el trigger; muestra tooltip nativo. */
  disabled?: boolean;
  disabledHint?: string;
  className?: string;
}

export function MultiSelectFilter<T extends string>({
  label,
  options,
  selected,
  onChange,
  emptyText,
  disabled,
  disabledHint,
  className,
}: MultiSelectFilterProps<T>) {
  const [open, setOpen] = useState(false);
  const count = selected.length;

  const toggle = (value: T) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          title={disabled && disabledHint ? disabledHint : undefined}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between gap-2 font-normal",
            count > 0 && "border-brand/40",
            className,
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <span className="truncate">{label}</span>
            {count > 0 ? (
              <Badge
                variant="secondary"
                className="h-5 shrink-0 px-1.5 text-xs"
                aria-label={`${count} seleccionados`}
              >
                {count}
              </Badge>
            ) : null}
          </span>
          <ChevronDown className="size-3.5 shrink-0 opacity-60" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        {options.length === 0 ? (
          <div className="px-3 py-4 text-sm text-muted-foreground">
            {emptyText ?? "Sin opciones."}
          </div>
        ) : (
          <ul
            role="listbox"
            aria-multiselectable="true"
            aria-label={label}
            className="max-h-72 overflow-y-auto py-1"
          >
            {options.map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggle(opt.value)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                      "hover:bg-muted focus-visible:bg-muted",
                      "focus-visible:outline-none",
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      // reason: el click se maneja en el botón padre — el
                      // checkbox aquí es puramente visual.
                      tabIndex={-1}
                      aria-hidden
                      onClick={(e) => e.preventDefault()}
                    />
                    {opt.hint}
                    <span className="flex-1 truncate">{opt.label}</span>
                    {isSelected ? (
                      <Check
                        className="size-3.5 shrink-0 text-brand"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {count > 0 ? (
          <div className="flex justify-end border-t border-border px-2 py-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange([])}
              className="h-7 text-xs"
            >
              Borrar selección
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
