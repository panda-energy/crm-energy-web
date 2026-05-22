"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useUsers, type UserListItem } from "@/lib/api/hooks/use-users";

/**
 * UserPicker — `cmdk` wrapper para elegir un usuario del tenant.
 *
 * Se monta dentro de un `Popover` o `Sheet` controlado por el caller.
 * Búsqueda debounced (250ms) contra `/v1/users?q=…`, role-agnostic por
 * defecto (filtrable por prop). Render: avatar inicial + nombre + email
 * + rol como hint en gris.
 *
 * a11y:
 *  - `cmdk` ya gestiona teclado (flechas / Enter / Esc).
 *  - El input declara `aria-label` con el `placeholder` para SR.
 *
 * Limitación conocida: solo lista los primeros 50 usuarios coincidentes
 * (`?limit=50`). En tenants muy grandes el usuario debe teclear para
 * encontrar matches fuera de la primera página — la búsqueda es server-side.
 */
export interface UserPickerProps {
  /** Disparado al seleccionar un usuario. El popover/sheet lo cierra el caller. */
  onSelect: (user: UserListItem) => void;
  /** Restringe a uno o más roles (default: todos). */
  role?: UserListItem["role"][];
  /** Placeholder del input. */
  placeholder?: string;
  /** Texto cuando no hay resultados. */
  emptyText?: string;
  /** IDs preseleccionados — se muestran con check visual y se ignoran al pulsar (no toggle). */
  selectedIds?: ReadonlyArray<string>;
}

export function UserPicker({
  onSelect,
  role,
  placeholder = "Buscar usuario…",
  emptyText = "Ningún usuario coincide.",
  selectedIds,
}: UserPickerProps) {
  const [draft, setDraft] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(draft.trim()), 250);
    return () => clearTimeout(t);
  }, [draft]);

  const usersQuery = useUsers({
    q: debounced || undefined,
    role,
    limit: 50,
  });

  const items = useMemo(
    () => usersQuery.data?.items ?? [],
    [usersQuery.data],
  );
  const selectedSet = useMemo(
    () => new Set(selectedIds ?? []),
    [selectedIds],
  );

  return (
    <Command
      // reason: filtramos server-side (búsqueda debounced); deshabilitamos
      // el filtro fuzzy local de cmdk para que muestre todo lo que el
      // backend devolvió.
      shouldFilter={false}
    >
      <CommandInput
        value={draft}
        onValueChange={setDraft}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <CommandList>
        {usersQuery.isLoading ? (
          <div className="px-3 py-4 text-sm text-muted-foreground">
            Cargando…
          </div>
        ) : items.length === 0 ? (
          <CommandEmpty>{emptyText}</CommandEmpty>
        ) : (
          <CommandGroup>
            {items.map((u) => {
              const display = u.name ?? u.email;
              const initials = makeInitials(u.name ?? u.email);
              const isSelected = selectedSet.has(u.id);
              return (
                <CommandItem
                  key={u.id}
                  // reason: cmdk usa `value` para el ranking; metemos email +
                  // name para que la query case con ambos aunque el filtro
                  // visual venga del servidor.
                  value={`${u.email} ${u.name ?? ""}`}
                  onSelect={() => onSelect(u)}
                  data-selected={isSelected ? "true" : undefined}
                  aria-selected={isSelected}
                >
                  <Avatar className="size-6">
                    <AvatarFallback className="text-[10px]">
                      {initials}
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
                  <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {u.role}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}

function makeInitials(value: string): string {
  const parts = value
    .split(/[\s.@_-]+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "?";
  return parts
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
