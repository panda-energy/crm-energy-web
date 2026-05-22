"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Lead } from "@/lib/api/hooks/use-leads";
import { composeInitials, composeLeadName } from "@/lib/leads/format";
import { formatRelativeTime } from "@/lib/leads/relative-time";
import {
  computeStagnationBadge,
  referenceDateForGrouping,
} from "@/lib/leads/timeline-grouping";
import { cn } from "@/lib/utils/cn";

import { LeadStatusBadge } from "./lead-status-badge";

/**
 * Sub-componentes presentacionales de la vista Timeline.
 *
 * Vive aparte de `leads-timeline-view.tsx` para mantener el archivo principal
 * <300 líneas. NO conoce server state ni router — solo recibe props.
 */

export function TimelineMonthHeader({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <li
      // reason: sticky por header — el usuario ve siempre en qué mes está
      // mientras hace scroll. `top-0` referido al contenedor con
      // `overflow-auto`.
      className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-surface/95 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur"
    >
      <span>{label}</span>
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
        {count} {count === 1 ? "lead" : "leads"}
      </span>
    </li>
  );
}

export function TimelineLeadCard({
  lead,
  onClick,
  now,
}: {
  lead: Lead;
  onClick: () => void;
  now?: Date;
}) {
  const name = composeLeadName(lead);
  const initials = composeInitials(lead);
  const stagnation = computeStagnationBadge(lead, now);
  const refIso = referenceDateForGrouping(lead);

  const visibleTags = lead.tags.slice(0, 2);
  const remainingTags = lead.tags.length - visibleTags.length;

  return (
    <li className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
          "hover:bg-muted/40 focus-visible:bg-muted/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        )}
        aria-label={`Abrir lead ${name}`}
      >
        <Avatar className="size-8 shrink-0 text-xs">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium text-foreground">
              {name}
            </span>
            <LeadStatusBadge status={lead.status} />
            {stagnation.label && stagnation.variant ? (
              <Badge
                variant={stagnation.variant}
                className="text-[10px] font-normal"
              >
                {stagnation.label}
              </Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{formatRelativeTime(refIso)}</span>
            {visibleTags.length > 0 ? (
              <span className="flex flex-wrap items-center gap-1">
                {visibleTags.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="text-[10px] font-normal"
                  >
                    {t}
                  </Badge>
                ))}
                {remainingTags > 0 ? (
                  <Badge variant="outline" className="text-[10px] font-normal">
                    +{remainingTags}
                  </Badge>
                ) : null}
              </span>
            ) : null}
          </div>
        </div>
      </button>
    </li>
  );
}

/**
 * Esqueleto del Timeline: tres grupos placeholder con 3 cards cada uno.
 * Aria-busy en el contenedor para anuncio de SR.
 */
export function TimelineSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="w-full overflow-hidden rounded-lg border border-border bg-surface"
    >
      <span className="sr-only">Cargando línea de tiempo de leads…</span>
      {Array.from({ length: 3 }).map((_, gi) => (
        <div key={gi} className="border-b border-border last:border-b-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
          {Array.from({ length: 3 }).map((__, li) => (
            <div
              key={li}
              className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0"
            >
              <Skeleton className="size-8 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
