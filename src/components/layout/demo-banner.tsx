"use client";

import { Info } from "lucide-react";

/**
 * Persistent banner displayed in the topbar when the app runs in demo mode
 * (no Clerk keys configured). Communicates clearly that data is fictitious.
 *
 * Renders only client-side since it checks `NEXT_PUBLIC_*` env vars.
 * Accessibility: `role="status"` + `aria-live="polite"` for screen readers.
 */
export function DemoBanner() {
  const isClerkConfigured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_replace_me",
  );

  if (isClerkConfigured) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-1.5 text-xs font-medium text-warning-foreground dark:text-warning"
    >
      <Info className="size-3.5 shrink-0" aria-hidden="true" />
      <span>
        Estas en modo demostracion — los datos son ficticios
      </span>
    </div>
  );
}
