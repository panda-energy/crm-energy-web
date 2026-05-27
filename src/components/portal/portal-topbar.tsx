"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const isClerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_replace_me",
);

/**
 * PortalTopbar -- simplified topbar for the customer portal.
 *
 * Shows: logo + "Portal Cliente" | spacer | theme toggle | user/logout.
 * No sidebar, no cmd-k, no AI chat.
 */
export function PortalTopbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur md:px-6">
      <Link href="/portal" className="flex items-center gap-2">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand text-brand-foreground font-bold"
          aria-hidden
        >
          P
        </div>
        <span className="text-sm font-semibold">Portal Cliente</span>
      </Link>

      <div className="ml-auto flex items-center gap-2">
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
            aria-label="Modo demo"
            title="Modo demo"
          >
            C
          </div>
        )}
      </div>
    </header>
  );
}
