"use client";

import { Loader2, Package } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts, type Product } from "@/lib/api/hooks/use-products";
import { useCalculateQuote, type QuoteCalculateResponse } from "@/lib/api/hooks/use-quotes";
import { ProductCard } from "./product-card";
import { QuoteSummary } from "./quote-summary";

/**
 * Product selector with quote simulation (F-3.4).
 *
 * Renders product cards from the catalog. When a product is selected
 * and CUPS energy data is available, calculates savings automatically.
 * Falls back to manual energy/cost input if no SIPS data.
 */
interface ProductSelectorProps {
  cupsId: string | null;
  /** Pre-fetched annual consumption from SIPS (kWh). */
  annualEnergyKwh: number | null;
  /** Pre-fetched annual cost. */
  annualTotalEur: number | null;
  /** Called when user selects a product. */
  onProductSelect: (product: Product | null) => void;
  /** Called when quote is calculated. */
  onQuoteCalculated?: (quote: QuoteCalculateResponse | null) => void;
  selectedProductId?: string | null;
}

export function ProductSelector({
  cupsId,
  annualEnergyKwh: initialEnergy,
  annualTotalEur: initialCost,
  onProductSelect,
  onQuoteCalculated,
  selectedProductId,
}: ProductSelectorProps) {
  const productsQuery = useProducts({ status: "active" });
  const calculateQuote = useCalculateQuote();

  const [selectedId, setSelectedId] = useState<string | null>(
    selectedProductId ?? null,
  );
  const [manualEnergy, setManualEnergy] = useState<string>(
    initialEnergy ? String(initialEnergy) : "",
  );
  const [manualCost, setManualCost] = useState<string>(
    initialCost ? String(initialCost) : "",
  );
  const [quote, setQuote] = useState<QuoteCalculateResponse | null>(null);

  const products = productsQuery.data?.items ?? [];
  const hasManualInput = !initialEnergy || !initialCost;

  const energyKwh = initialEnergy ?? (manualEnergy ? Number(manualEnergy) : null);
  const totalEur = initialCost ?? (manualCost ? Number(manualCost) : null);

  const runQuote = useCallback(
    async (productId: string) => {
      if (!energyKwh || !totalEur || energyKwh <= 0 || totalEur <= 0) return;
      try {
        const result = await calculateQuote.mutateAsync({
          baseline: {
            annual_energy_kwh: energyKwh,
            annual_total_eur: totalEur,
          },
          cups_id: cupsId,
          product_id: productId,
        });
        setQuote(result);
        onQuoteCalculated?.(result);
      } catch {
        setQuote(null);
        onQuoteCalculated?.(null);
      }
    },
    [energyKwh, totalEur, cupsId, calculateQuote, onQuoteCalculated],
  );

  const handleSelect = useCallback(
    (product: Product) => {
      const newId = product.id === selectedId ? null : product.id;
      setSelectedId(newId);
      onProductSelect(newId ? product : null);
      if (newId) {
        void runQuote(newId);
      } else {
        setQuote(null);
        onQuoteCalculated?.(null);
      }
    },
    [selectedId, onProductSelect, runQuote, onQuoteCalculated],
  );

  // Re-calculate when manual inputs change
  useEffect(() => {
    if (selectedId && energyKwh && totalEur && energyKwh > 0 && totalEur > 0) {
      const timeout = setTimeout(() => {
        void runQuote(selectedId);
      }, 500);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [manualEnergy, manualCost]); // eslint-disable-line react-hooks/exhaustive-deps

  if (productsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (productsQuery.isError) {
    return (
      <EmptyState
        icon={<Package />}
        title="Error al cargar productos"
        description={productsQuery.error?.message}
      />
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Package />}
        title="Sin productos activos"
        description="No hay productos disponibles. Contacta al administrador."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Manual input when no SIPS data */}
      {hasManualInput && (
        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">
            Datos de consumo (manual)
          </p>
          <p className="text-xs text-muted-foreground">
            No hay datos SIPS disponibles. Introduce el consumo manualmente para simular el ahorro.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="manual-energy" className="text-xs">
                Consumo anual (kWh)
              </Label>
              <Input
                id="manual-energy"
                type="number"
                placeholder="3500"
                value={manualEnergy}
                onChange={(e) => setManualEnergy(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="manual-cost" className="text-xs">
                Coste anual (EUR)
              </Label>
              <Input
                id="manual-cost"
                type="number"
                placeholder="720"
                value={manualCost}
                onChange={(e) => setManualCost(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Product cards */}
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        role="listbox"
        aria-label="Seleccionar producto"
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            selected={product.id === selectedId}
            onSelect={() => handleSelect(product)}
          />
        ))}
      </div>

      {/* Quote result */}
      {selectedId && (
        <QuoteSummary
          quote={quote}
          isLoading={calculateQuote.isPending}
          error={calculateQuote.error}
        />
      )}
    </div>
  );
}
