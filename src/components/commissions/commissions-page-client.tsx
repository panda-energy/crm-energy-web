"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChannelsTab } from "./channels-tab";
import { CommissionsTable } from "./commissions-table";
import { MyDashboardTab } from "./my-dashboard-tab";

/**
 * CommissionsPageClient -- client-rendered content for /commissions.
 *
 * Three tabs: Canales | Liquidaciones | Mi Dashboard
 */
export function CommissionsPageClient() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Comisiones</h1>
      </div>

      <Tabs defaultValue="channels">
        <TabsList>
          <TabsTrigger value="channels">Canales</TabsTrigger>
          <TabsTrigger value="settlements">Liquidaciones</TabsTrigger>
          <TabsTrigger value="dashboard">Mi Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="channels">
          <ChannelsTab />
        </TabsContent>

        <TabsContent value="settlements">
          <CommissionsTable />
        </TabsContent>

        <TabsContent value="dashboard">
          <MyDashboardTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
