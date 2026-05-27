"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar";
import { Breadcrumbs } from "./breadcrumbs";
import { ThemeToggle } from "./theme-toggle";
import { CommandPaletteTrigger } from "@/components/command-palette/command-palette-trigger";
import { LiveIndicator } from "./live-indicator";

const isClerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_replace_me",
);

/**
 * Topbar del CRM.
 *
 * Composición (izq → der):
 *  - Trigger sidebar móvil (Sheet) — solo en `<md`.
 *  - Breadcrumbs dinámicos — solo en `md+`.
 *  - Spacer.
 *  - OrganizationSwitcher de Clerk — cambio de tenant.
 *  - Dark mode toggle.
 *  - UserButton de Clerk — avatar + menú perfil/logout.
 *
 * Sin claves Clerk los componentes UserButton/OrganizationSwitcher se
 * sustituyen por un placeholder discreto (modo demo).
 *
 * Altura fija `h-14`. Sticky para que no desaparezca al scrollear.
 */
export function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur md:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="size-4" aria-hidden />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle>Panda Energy</SheetTitle>
          </SheetHeader>
          <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <Breadcrumbs />

      <div className="ml-auto flex items-center gap-2">
        <LiveIndicator />
        <CommandPaletteTrigger />
        {isClerkConfigured ? (
          <OrganizationSwitcher
            hidePersonal
            appearance={{
              elements: {
                rootBox: "flex",
                organizationSwitcherTrigger:
                  "rounded-md px-2 py-1 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              },
            }}
          />
        ) : null}
        <ThemeToggle />
        {isClerkConfigured ? (
          <UserButton
            appearance={{
              elements: {
                avatarBox: "size-8",
              },
            }}
          />
        ) : (
          <div
            className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
            aria-label="Modo demo (sin auth)"
            title="Modo demo (sin auth)"
          >
            D
          </div>
        )}
      </div>
    </header>
  );
}
