"use client";

import { RotateCcw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOnboardingStore } from "@/lib/ui/onboarding-store";
import { GeneralTab } from "./general-tab";
import { BrandTab } from "./brand-tab";
import { ProductsTab } from "./products-tab";
import { TeamTab } from "./team-tab";
import { IntegrationsTab } from "./integrations-tab";

/**
 * Settings page client component with 5 tabs:
 * General | Marca | Productos | Equipo | Integraciones
 *
 * Replaces the ComingSoonPlaceholder stub.
 */
export function SettingsPageClient() {
  const resetTour = useOnboardingStore((s) => s.resetTour);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10">
            <Settings className="size-5 text-brand" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Configuracion
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestiona la identidad, productos, equipo e integraciones de tu cuenta
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={resetTour}>
          <RotateCcw className="mr-1.5 size-4" aria-hidden="true" />
          Repetir tour
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="brand">Marca</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="team">Equipo</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab />
        </TabsContent>
        <TabsContent value="brand">
          <BrandTab />
        </TabsContent>
        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>
        <TabsContent value="team">
          <TeamTab />
        </TabsContent>
        <TabsContent value="integrations">
          <IntegrationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
