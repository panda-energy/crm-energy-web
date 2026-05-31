"use client";

import Link from "next/link";
import {
  BarChart3,
  FileText,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * PortalLanding -- customer portal home page with navigation cards.
 */

const SECTIONS = [
  {
    title: "Mi consumo",
    description: "Consulta tu consumo mensual con graficos detallados.",
    href: "/portal/consumption",
    icon: BarChart3,
  },
  {
    title: "Mis facturas",
    description: "Historico de facturas con descarga de PDF.",
    href: "/portal/invoices",
    icon: FileText,
  },
  {
    title: "Modificar potencia",
    description: "Solicita cambios de potencia contratada.",
    href: "/portal/power",
    icon: Zap,
  },
] as const;

export function PortalLanding() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenido a tu portal de energia
        </h1>
        <p className="mt-2 text-muted-foreground">
          Gestiona tu consumo, facturas y potencia contratada desde un solo
          lugar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
            >
              <Card className="h-full transition-colors group-hover:border-brand/50 group-hover:bg-muted/30">
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <CardTitle className="mt-2 text-base">
                    {section.title}
                  </CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
