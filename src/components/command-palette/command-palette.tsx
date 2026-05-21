"use client";

import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  Eraser,
  History,
  LogOut,
  Moon,
  Plus,
  Search,
  SunMedium,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useLeads } from "@/lib/api/hooks/use-leads";
import { usePipelines } from "@/lib/api/hooks/use-pipelines";
import { composeLeadName } from "@/lib/leads/format";
import { useCmdkStore } from "@/lib/ui/cmdk-store";
import {
  addRecent,
  loadRecents,
  saveRecents,
  type CmdkRecent,
} from "@/lib/ui/cmdk-recents";
import { useGlobalShortcut } from "@/lib/ui/use-global-shortcut";

const isClerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_replace_me",
);

/**
 * Command palette global (F-2.5).
 *
 * Estructura del dialog:
 *  1. Acciones rápidas (siempre visibles, sensibles al pathname).
 *  2. Recientes (solo si query vacío).
 *  3. Búsqueda de leads (debounced 200ms, hits con nombre/email).
 *  4. Búsqueda de pipelines (filtra en cliente).
 *
 * Atajo global: `mod+k`. Cerrar: Esc (lo cubre `cmdk`).
 */

const CMD_DEBOUNCE_MS = 200;

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const clerk = useClerk();
  const open = useCmdkStore((s) => s.open);
  const setOpen = useCmdkStore((s) => s.setOpen);
  const toggle = useCmdkStore((s) => s.toggle);

  // Atajo global. Habilitamos en cualquier ruta autenticada.
  useGlobalShortcut("mod+k", toggle);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recents, setRecents] = useState<CmdkRecent[]>([]);

  // Hidrata recientes al primer mount client-side.
  useEffect(() => {
    setRecents(loadRecents());
  }, []);

  // Limpia el query cuando se cierra.
  useEffect(() => {
    if (!open) {
      const id = setTimeout(() => setQuery(""), 150);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [open]);

  // Debounce para la búsqueda de leads (evita request por keystroke).
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), CMD_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const leadsQuery = useLeads(
    debouncedQuery.length >= 2
      ? { q: debouncedQuery, limit: 8 }
      : { limit: 0 },
  );
  const pipelinesQuery = usePipelines();

  const filteredPipelines = useMemo(() => {
    const all = pipelinesQuery.data ?? [];
    if (!query) return all;
    const q = query.toLowerCase();
    return all.filter((p) => p.name.toLowerCase().includes(q));
  }, [pipelinesQuery.data, query]);

  // Helper para registrar uso + cerrar + ejecutar acción.
  const runAndRecord = useCallback(
    (item: Omit<CmdkRecent, "lastUsedAt">, action: () => void) => {
      setRecents((prev) => {
        const next = addRecent(prev, item);
        saveRecents(next);
        return next;
      });
      setOpen(false);
      // Pequeño defer para que el cierre del dialog no compita con el push.
      setTimeout(() => action(), 0);
    },
    [setOpen],
  );

  const isOnLeads = pathname?.startsWith("/leads") ?? false;
  const isOnPipeline = pathname?.startsWith("/pipeline") ?? false;
  const themeNext = theme === "dark" ? "light" : "dark";

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Command palette">
      <CommandInput
        placeholder="Buscar leads, ejecutar acciones…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Sin resultados para “{query}”.</CommandEmpty>

        {/* ── Recientes (solo si query vacío) ──────────────────────── */}
        {query === "" && recents.length > 0 ? (
          <>
            <CommandGroup heading="Recientes">
              {recents.map((r) => (
                <CommandItem
                  key={r.id}
                  value={`recent ${r.label} ${r.subtitle ?? ""}`}
                  onSelect={() => {
                    if (r.href) {
                      runAndRecord(r, () => router.push(r.href!));
                    } else {
                      setOpen(false);
                    }
                  }}
                >
                  <History className="size-4 text-muted-foreground" aria-hidden />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{r.label}</span>
                    {r.subtitle ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {r.subtitle}
                      </span>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        ) : null}

        {/* ── Acciones rápidas ───────────────────────────────────────── */}
        <CommandGroup heading="Acciones rápidas">
          <CommandItem
            value="crear lead nuevo"
            onSelect={() =>
              runAndRecord(
                {
                  id: "action:create-lead",
                  label: "Crear lead",
                  kind: "action",
                  href: "/leads?createLead=1",
                },
                () => router.push("/leads?createLead=1"),
              )
            }
          >
            <Plus className="size-4" aria-hidden />
            Crear lead
          </CommandItem>
          <CommandItem
            value="ir a leads"
            onSelect={() =>
              runAndRecord(
                { id: "action:goto-leads", label: "Ir a Leads", kind: "action", href: "/leads" },
                () => router.push("/leads"),
              )
            }
          >
            <Users className="size-4" aria-hidden />
            Ir a Leads
          </CommandItem>
          <CommandItem
            value="ir a pipeline kanban"
            onSelect={() =>
              runAndRecord(
                {
                  id: "action:goto-pipeline",
                  label: "Ir a Pipeline",
                  kind: "action",
                  href: "/pipeline",
                },
                () => router.push("/pipeline"),
              )
            }
          >
            <BarChart3 className="size-4" aria-hidden />
            Ir a Pipeline
          </CommandItem>
          <CommandItem
            value={`tema ${themeNext} oscuro claro`}
            onSelect={() => {
              setTheme(themeNext);
              setOpen(false);
            }}
          >
            {theme === "dark" ? (
              <SunMedium className="size-4" aria-hidden />
            ) : (
              <Moon className="size-4" aria-hidden />
            )}
            Alternar tema ({themeNext === "dark" ? "oscuro" : "claro"})
          </CommandItem>
          {isClerkConfigured ? (
            <CommandItem
              value="cerrar sesion logout"
              onSelect={() => {
                setOpen(false);
                void clerk.signOut();
              }}
            >
              <LogOut className="size-4" aria-hidden />
              Cerrar sesión
            </CommandItem>
          ) : null}
          {isOnLeads ? (
            <CommandItem
              value="limpiar filtros leads"
              onSelect={() => {
                setOpen(false);
                router.replace("/leads");
              }}
            >
              <Eraser className="size-4" aria-hidden />
              Limpiar filtros (Leads)
            </CommandItem>
          ) : null}
          {isOnPipeline ? (
            <CommandItem
              value="cambiar de pipeline"
              onSelect={() => {
                setOpen(false);
                document
                  .getElementById("pipeline-selector")
                  ?.focus();
              }}
            >
              <BarChart3 className="size-4" aria-hidden />
              Cambiar de pipeline
            </CommandItem>
          ) : null}
        </CommandGroup>

        {/* ── Búsqueda Leads ─────────────────────────────────────────── */}
        {debouncedQuery.length >= 2 && (leadsQuery.data?.items ?? []).length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Leads">
              {leadsQuery.data!.items.map((lead) => {
                const name = composeLeadName(lead);
                const subtitle = lead.email ?? lead.company ?? "";
                return (
                  <CommandItem
                    key={lead.id}
                    value={`${name} ${subtitle} ${lead.id}`}
                    keywords={[name, subtitle, lead.status]}
                    onSelect={() => {
                      runAndRecord(
                        {
                          id: `lead:${lead.id}`,
                          label: name,
                          subtitle,
                          kind: "lead",
                          href: `/leads/${lead.id}`,
                        },
                        () => router.push(`/leads/${lead.id}`),
                      );
                    }}
                  >
                    <Search className="size-4 text-muted-foreground" aria-hidden />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">{name}</span>
                      {subtitle ? (
                        <span className="truncate text-xs text-muted-foreground">
                          {subtitle}
                        </span>
                      ) : null}
                    </div>
                    <span className="ml-auto text-[10px] uppercase text-muted-foreground">
                      {lead.status}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        ) : null}

        {/* ── Búsqueda Pipelines ─────────────────────────────────────── */}
        {filteredPipelines.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Pipelines">
              {filteredPipelines.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`pipeline ${p.name}`}
                  keywords={[p.name, p.slug]}
                  onSelect={() => {
                    runAndRecord(
                      {
                        id: `pipeline:${p.id}`,
                        label: p.name,
                        kind: "pipeline",
                        href: `/pipeline?pipelineId=${p.id}`,
                      },
                      () => router.push(`/pipeline?pipelineId=${p.id}`),
                    );
                  }}
                >
                  <Building2 className="size-4 text-muted-foreground" aria-hidden />
                  <span className="truncate">{p.name}</span>
                  {p.is_default ? (
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      por defecto
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
