"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { segmentLabels } from "@/lib/ui/nav-config";

/**
 * Breadcrumbs dinámicos basados en `usePathname()`.
 *
 * Reglas:
 *  - El primer segmento es siempre `Inicio` apuntando a `/dashboard`.
 *  - El resto se mapea con `segmentLabels` (es-ES). Fallback: capitalizar
 *    el segmento crudo.
 *  - El último segmento se renderiza como `<BreadcrumbPage>` (no link,
 *    `aria-current="page"`).
 *  - Segmentos que parecen IDs (UUIDs o números) NO se traducen — se
 *    renderizan como están, truncados a 8 chars con `…`.
 *
 * No se muestran breadcrumbs en `/dashboard` solo (sin sub-rutas) porque
 * añadiría ruido visual.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC_RE = /^\d+$/;

function isIdSegment(seg: string): boolean {
  return UUID_RE.test(seg) || NUMERIC_RE.test(seg);
}

function labelFor(segment: string): string {
  if (isIdSegment(segment)) {
    return segment.length > 8 ? `${segment.slice(0, 8)}…` : segment;
  }
  const mapped = segmentLabels[segment];
  if (mapped) return mapped;
  // Fallback: capitaliza primera letra.
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Solo dashboard → ocultamos.
  if (segments.length <= 1 && segments[0] === "dashboard") return null;
  if (segments.length === 0) return null;

  // Construye rutas acumulativas.
  const crumbs = segments.map((seg, idx) => ({
    label: labelFor(seg),
    href: `/${segments.slice(0, idx + 1).join("/")}`,
    isLast: idx === segments.length - 1,
  }));

  return (
    <Breadcrumb className="hidden md:block">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">Inicio</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((c) => (
          <Fragment key={c.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {c.isLast ? (
                <BreadcrumbPage>{c.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={c.href}>{c.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
