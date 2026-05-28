"use client";

import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { useProducts } from "@/lib/api/hooks/use-products";
import { useTranslations } from "@/lib/i18n";

/**
 * Products tab in settings -- displays the tenant product catalog
 * with create/edit/deactivate actions. Reuses useProducts hook from Sprint 3.
 */
export function ProductsTab() {
  const { t } = useTranslations();
  const { data, isLoading, error } = useProducts({ limit: 50 });

  if (isLoading) {
    return <TableSkeleton rows={5} cols={5} />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-danger">
          {t("errors.loadFailed")}
        </CardContent>
      </Card>
    );
  }

  const products = data?.items ?? [];

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Package />}
        title={t("empty.products")}
        description="Crea tu primer producto energetico para empezar a generar contratos."
        action={
          <Button size="sm">
            <Plus className="mr-1.5 size-4" aria-hidden="true" />
            Crear producto
          </Button>
        }
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Catalogo de productos</CardTitle>
          <CardDescription>{products.length} productos registrados</CardDescription>
        </div>
        <Button size="sm">
          <Plus className="mr-1.5 size-4" aria-hidden="true" />
          Crear producto
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Catalogo de productos">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Codigo</th>
                <th className="px-3 py-2 font-medium">Nombre</th>
                <th className="px-3 py-2 font-medium">Tipo</th>
                <th className="px-3 py-2 font-medium">Tarifa</th>
                <th className="px-3 py-2 font-medium">Duracion</th>
                <th className="px-3 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50"
                >
                  <td className="px-3 py-2.5 font-mono text-xs">
                    {product.code}
                  </td>
                  <td className="px-3 py-2.5 font-medium">{product.name}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant="secondary" className="text-xs">
                      {product.energy_type}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {product.tariff_kind}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {product.term_months} meses
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge
                      variant={product.status === "active" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {t(`statuses.${product.status}` as Parameters<typeof t>[0])}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
