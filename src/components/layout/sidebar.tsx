"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useSidebarStore } from "@/lib/ui/sidebar-store";
import { navItems } from "@/lib/ui/nav-config";
import { useTranslations } from "@/lib/i18n";

/**
 * Sidebar desktop colapsable.
 *
 * - `collapsed` proviene de `useSidebarStore` (Zustand persistido).
 * - Item activo se detecta por `usePathname()` comparando con `item.href`.
 * - Cuando está colapsado mostramos solo el icono (40×40) con tooltip nativo
 *   vía `title=`. Más adelante (Sprint 3+) podemos sustituir por
 *   `<Tooltip>` de Radix.
 * - El botón de colapso es visible solo en md+ (no aplica a mobile, que
 *   usa el sidebar dentro de un Sheet).
 * - Accesibilidad: `nav` con `aria-label`, items son `<a>` (vía Link), focus
 *   visible mediante token `--ring`.
 *
 * Esta variante es DESKTOP-ONLY. La equivalente móvil se renderiza dentro
 * de `<Sheet>` en `<Topbar>`.
 */
export function Sidebar() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "hidden md:flex md:flex-col",
        "sticky top-0 h-screen shrink-0",
        "border-r border-border bg-surface",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-60",
      )}
      aria-label="Navegación principal"
    >
      <div className="flex h-14 items-center gap-2 border-b border-border px-3">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand text-brand-foreground font-bold"
          aria-hidden
        >
          P
        </div>
        {!collapsed ? (
          <span className="truncate text-sm font-semibold">Panda Energy</span>
        ) : null}
      </div>

      <SidebarNav collapsed={collapsed} />

      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          aria-expanded={!collapsed}
          className={cn("w-full justify-start gap-2", collapsed && "justify-center")}
        >
          {collapsed ? (
            <ChevronRight className="size-4" aria-hidden />
          ) : (
            <>
              <ChevronLeft className="size-4" aria-hidden />
              <span>Colapsar</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}

interface SidebarNavProps {
  collapsed: boolean;
  /** Llamado tras click en un item — usado por el sidebar móvil para cerrar el Sheet. */
  onNavigate?: () => void;
}

/**
 * Lista de items — extraída para reuso por el sidebar móvil (dentro de Sheet).
 */
export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const { t } = useTranslations();

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3">
      <ul className="flex flex-col gap-1">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          // reason: i18nKey is a valid MessageKey at runtime, cast is safe
          // because nav-config keys match the es.json nav.* structure exactly.
          const label = t(item.i18nKey as Parameters<typeof t>[0]);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  "text-muted-foreground transition-colors",
                  "hover:bg-muted hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                  active && "bg-muted text-foreground",
                  collapsed && "justify-center px-0",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {!collapsed ? <span className="truncate">{label}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
