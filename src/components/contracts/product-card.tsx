"use client";

import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Product } from "@/lib/api/hooks/use-products";
import { cn } from "@/lib/utils/cn";

/**
 * Visual product card for selection in the contract wizard (F-3.4).
 *
 * Shows name, tariff kind, term, energy type, and pricing summary.
 * Highlighted when selected.
 */
interface ProductCardProps {
  product: Product;
  selected: boolean;
  onSelect: () => void;
}

const TARIFF_LABELS: Record<string, string> = {
  fixed: "Fija",
  indexed_omie: "Indexada OMIE",
  multi_period: "Multi-periodo",
};

const ENERGY_LABELS: Record<string, string> = {
  electricity: "Electricidad",
  gas: "Gas",
};

export function ProductCard({ product, selected, onSelect }: ProductCardProps) {
  const pricing = product.pricing as Record<string, unknown>;
  const energyPrice =
    pricing.energy_eur_per_kwh ?? pricing.energy_p1_eur_per_kwh ?? pricing.margin_eur_per_kwh;

  return (
    <Card
      className={cn(
        "relative cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
        selected && "border-primary ring-2 ring-primary/20",
      )}
      onClick={onSelect}
      role="option"
      aria-selected={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {selected && (
        <div className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-4" aria-hidden />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{product.name}</CardTitle>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-xs">
            {TARIFF_LABELS[product.tariff_kind] ?? product.tariff_kind}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {ENERGY_LABELS[product.energy_type] ?? product.energy_type}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {product.term_months} meses
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="font-mono text-xs text-muted-foreground">
          {product.code}
        </p>
        {energyPrice != null && (
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-foreground">
              {Number(energyPrice).toFixed(3)}
            </span>
            <span className="text-xs text-muted-foreground">EUR/kWh</span>
          </div>
        )}
        {product.notes && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {product.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
