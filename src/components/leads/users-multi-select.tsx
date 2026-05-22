"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUsers, type UserListItem } from "@/lib/api/hooks/use-users";
import { cn } from "@/lib/utils/cn";

/**
 * UsersMultiSelect — selector multi-valor para filtrar leads por propietario.
 *
 * Reemplaza al placeholder MultiSelectFilter vacío + input UUID plano del
 * Sprint 2 inicial (deuda backend cerrada en cleanup wave). Lista
 * paginada vía `useUsers`, búsqueda debounced (250ms), chips para mostrar
 * la selección activa y permitir quitarla.
 *
 * Mantiene la misma API conceptual que `MultiSelectFilter` para que el
 * caller solo sustituya el componente:
 *  - `selected: string[]` — array de owner IDs.
 *  - `onChange(next: string[])` — disparador.
 *
 * Como cacheamos los usuarios consultados (recientes + actualmente
 * seleccionados), los chips no muestran UUIDs truncados cuando el
 * usuario navega entre filtros sin re-fetch.
 */
export interface UsersMultiSelectProps {
  selected: ReadonlyArray<string>;
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function UsersMultiSelect({
  selected,
  onChange,
  placeholder = "Sin asignar / cualquiera",
  className,
}: UsersMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(draft.trim()), 250);
    return () => clearTimeout(t);
  }, [draft]);

  const usersQuery = useUsers({ q: debounced || undefined, limit: 50 });
  const items = useMemo(
    () => usersQuery.data?.items ?? [],
    [usersQuery.data],
  );

  // Caché local de usuarios "vistos" para resolver IDs seleccionados que
  // queden fuera de la página actual (ej. después de filtrar por texto).
  const [seen, setSeen] = useState<Map<string, UserListItem>>(new Map());
  useEffect(() => {
    if (items.length === 0) return;
    setSeen((prev) => {
      const next = new Map(prev);
      for (const u of items) next.set(u.id, u);
      return next;
    });
  }, [items]);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const count = selected.length;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            aria-haspopup="listbox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between gap-2 font-normal",
              count > 0 && "border-brand/40",
            )}
          >
            <span className="flex items-center gap-2 truncate">
              <span className="truncate">{placeholder}</span>
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
        <PopoverContent align="start" className="w-72 p-0">
          <Command shouldFilter={false}>
            <CommandInput
              value={draft}
              onValueChange={setDraft}
              placeholder="Buscar propietario…"
            />
            <CommandList>
              {usersQuery.isLoading ? (
                <div className="px-3 py-4 text-sm text-muted-foreground">
                  Cargando…
                </div>
              ) : items.length === 0 ? (
                <CommandEmpty>Ningún usuario coincide.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {items.map((u) => {
                    const display = u.name ?? u.email;
                    const isSelected = selected.includes(u.id);
                    return (
                      <CommandItem
                        key={u.id}
                        value={`${u.email} ${u.name ?? ""}`}
                        onSelect={() => toggle(u.id)}
                        aria-selected={isSelected}
                      >
                        <Avatar className="size-6">
                          <AvatarFallback className="text-[10px]">
                            {makeInitials(display)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-2 flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm">{display}</span>
                          {u.name ? (
                            <span className="truncate text-[11px] text-muted-foreground">
                              {u.email}
                            </span>
                          ) : null}
                        </div>
                        {isSelected ? (
                          <Check
                            className="ml-2 size-3.5 shrink-0 text-brand"
                            aria-hidden
                          />
                        ) : null}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
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
          </Command>
        </PopoverContent>
      </Popover>

      {count > 0 ? (
        <ul className="flex flex-wrap gap-1" aria-label="Propietarios seleccionados">
          {selected.map((id) => {
            const u = seen.get(id);
            const label = u?.name ?? u?.email ?? `${id.slice(0, 8)}…`;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  aria-label={`Quitar ${label}`}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted/70"
                >
                  {label}
                  <X className="size-3" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function makeInitials(value: string): string {
  const parts = value
    .split(/[\s.@_-]+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "?";
  return parts.map((p) => p[0]!.toUpperCase()).join("");
}
