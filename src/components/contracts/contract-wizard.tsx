"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, FileText, Loader2, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeads, type Lead } from "@/lib/api/hooks/use-leads";
import { useCups, type Cups } from "@/lib/api/hooks/use-cups";
import type { Product } from "@/lib/api/hooks/use-products";
import { useCreateContract } from "@/lib/api/hooks/use-contracts";
import type { QuoteCalculateResponse } from "@/lib/api/hooks/use-quotes";
import { ContractCreateSchema } from "@/lib/api/zod-schemas";
import { toast } from "@/lib/ui/toast";
import { ProductSelector } from "./product-selector";
import { WizardSteps } from "./wizard-step";

/**
 * Multi-step contract creation wizard (F-3.3).
 *
 * Steps:
 *  1. Select lead (search with autocomplete)
 *  2. Select/create CUPS
 *  3. Select product + view savings simulation
 *  4. Review summary + create
 */

const STEPS = [
  { title: "Lead", description: "Seleccionar cliente" },
  { title: "CUPS", description: "Punto de suministro" },
  { title: "Producto", description: "Tarifa y ahorro" },
  { title: "Resumen", description: "Confirmar contrato" },
];

interface ContractWizardProps {
  onComplete: (contractId: string) => void;
  onCancel: () => void;
}

export function ContractWizard({ onComplete, onCancel }: ContractWizardProps) {
  const [step, setStep] = useState(0);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedCups, setSelectedCups] = useState<Cups | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quote, setQuote] = useState<QuoteCalculateResponse | null>(null);

  const canGoNext = useMemo(() => {
    switch (step) {
      case 0: return selectedLead !== null;
      case 1: return selectedCups !== null;
      case 2: return selectedProduct !== null;
      case 3: return true;
      default: return false;
    }
  }, [step, selectedLead, selectedCups, selectedProduct]);

  const handleNext = () => {
    if (canGoNext && step < STEPS.length - 1) setStep(step + 1);
  };
  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <WizardSteps steps={STEPS} currentStep={step} />

      {step === 0 && (
        <Step1Lead
          selectedLead={selectedLead}
          onSelect={setSelectedLead}
        />
      )}
      {step === 1 && (
        <Step2Cups
          selectedCups={selectedCups}
          onSelect={setSelectedCups}
        />
      )}
      {step === 2 && (
        <Step3Product
          cupsId={selectedCups?.id ?? null}
          selectedProduct={selectedProduct}
          onProductSelect={setSelectedProduct}
          onQuoteCalculated={setQuote}
        />
      )}
      {step === 3 && (
        <Step4Review
          lead={selectedLead}
          cups={selectedCups}
          product={selectedProduct}
          quote={quote}
          onComplete={onComplete}
        />
      )}

      {/* Navigation */}
      <div className="flex justify-between border-t border-border pt-4">
        <Button
          variant="outline"
          onClick={step === 0 ? onCancel : handleBack}
        >
          <ArrowLeft className="mr-1.5 size-4" aria-hidden />
          {step === 0 ? "Cancelar" : "Anterior"}
        </Button>
        {step < STEPS.length - 1 && (
          <Button onClick={handleNext} disabled={!canGoNext}>
            Siguiente
            <ArrowRight className="ml-1.5 size-4" aria-hidden />
          </Button>
        )}
      </div>
    </div>
  );
}

/** Step 1: Select a lead via search. */
function Step1Lead({
  selectedLead,
  onSelect,
}: {
  selectedLead: Lead | null;
  onSelect: (lead: Lead | null) => void;
}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const searchTimeout = useMemo(
    () => ({ current: null as ReturnType<typeof setTimeout> | null }),
    [],
  );
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => setDebouncedSearch(value), 300);
    },
    [searchTimeout],
  );

  const leadsQuery = useLeads({
    q: debouncedSearch || undefined,
    limit: 10,
  });

  const items = leadsQuery.data?.items ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Seleccionar lead</h2>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden />
        <Input
          placeholder="Buscar por nombre, email, telefono..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
          aria-label="Buscar lead"
        />
      </div>

      {selectedLead && (
        <Card className="border-primary">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">
                {selectedLead.first_name} {selectedLead.last_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedLead.email ?? selectedLead.phone_e164 ?? "Sin contacto"}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onSelect(null)}>
              Cambiar
            </Button>
          </CardContent>
        </Card>
      )}

      {!selectedLead && leadsQuery.isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {!selectedLead && items.length > 0 && (
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {items.map((lead) => (
            <button
              key={lead.id}
              type="button"
              className="w-full rounded-md border border-border p-3 text-left transition-colors hover:bg-muted/50"
              onClick={() => onSelect(lead)}
            >
              <p className="font-medium text-sm">
                {lead.first_name} {lead.last_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {lead.email ?? ""} {lead.phone_e164 ?? ""} {lead.company ?? ""}
              </p>
            </button>
          ))}
        </div>
      )}

      {!selectedLead && debouncedSearch && items.length === 0 && !leadsQuery.isLoading && (
        <p className="text-center text-sm text-muted-foreground py-4">
          No se encontraron leads para &ldquo;{debouncedSearch}&rdquo;
        </p>
      )}
    </div>
  );
}

/** Step 2: Select CUPS. */
function Step2Cups({
  selectedCups,
  onSelect,
}: {
  selectedCups: Cups | null;
  onSelect: (cups: Cups | null) => void;
}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const searchTimeout = useMemo(
    () => ({ current: null as ReturnType<typeof setTimeout> | null }),
    [],
  );
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => setDebouncedSearch(value), 300);
    },
    [searchTimeout],
  );

  const cupsQuery = useCups({
    q: debouncedSearch || undefined,
    limit: 10,
  });
  const items = cupsQuery.data?.items ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Seleccionar CUPS</h2>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden />
        <Input
          placeholder="Buscar por codigo CUPS o direccion..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
          aria-label="Buscar CUPS"
        />
      </div>

      {selectedCups && (
        <Card className="border-primary">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-mono text-sm font-medium">{selectedCups.code}</p>
              <p className="text-xs text-muted-foreground">
                {selectedCups.address ?? "Sin dirección"}
                {selectedCups.city && `, ${selectedCups.city}`}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onSelect(null)}>
              Cambiar
            </Button>
          </CardContent>
        </Card>
      )}

      {!selectedCups && cupsQuery.isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {!selectedCups && items.length > 0 && (
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {items.map((cups) => (
            <button
              key={cups.id}
              type="button"
              className="w-full rounded-md border border-border p-3 text-left transition-colors hover:bg-muted/50"
              onClick={() => onSelect(cups)}
            >
              <p className="font-mono text-sm font-medium">{cups.code}</p>
              <p className="text-xs text-muted-foreground">
                {cups.address ?? ""} {cups.city ?? ""}{" "}
                {cups.distributor_name ? `(${cups.distributor_name})` : ""}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Step 3: Product selection + quote. */
function Step3Product({
  cupsId,
  selectedProduct,
  onProductSelect,
  onQuoteCalculated,
}: {
  cupsId: string | null;
  selectedProduct: Product | null;
  onProductSelect: (p: Product | null) => void;
  onQuoteCalculated: (q: QuoteCalculateResponse | null) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Seleccionar producto</h2>
      <ProductSelector
        cupsId={cupsId}
        annualEnergyKwh={null}
        annualTotalEur={null}
        onProductSelect={onProductSelect}
        onQuoteCalculated={onQuoteCalculated}
        selectedProductId={selectedProduct?.id}
      />
    </div>
  );
}

/** Step 4: Review + create. */
function Step4Review({
  lead,
  cups,
  product,
  quote,
  onComplete,
}: {
  lead: Lead | null;
  cups: Cups | null;
  product: Product | null;
  quote: QuoteCalculateResponse | null;
  onComplete: (contractId: string) => void;
}) {
  const createContract = useCreateContract();

  const CustomerSchema = z.object({
    customer_name: z.string().min(1, "Nombre requerido"),
    customer_tax_id: z.string().min(1, "NIF/CIF requerido"),
    customer_email: z.string().email("Email no valido").nullish(),
    customer_phone_e164: z.string().nullish(),
    billing_address: z.string().nullish(),
  });

  const form = useForm({
    resolver: zodResolver(CustomerSchema),
    defaultValues: {
      customer_name:
        lead ? `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim() : "",
      customer_tax_id: "",
      customer_email: lead?.email ?? "",
      customer_phone_e164: lead?.phone_e164 ?? "",
      billing_address: cups?.address ?? "",
    },
  });

  const handleCreate = form.handleSubmit(async (data) => {
    if (!lead || !cups || !product) return;
    try {
      const result = await createContract.mutateAsync({
        lead_id: lead.id,
        cups_id: cups.id,
        product_id: product.id,
        customer_name: data.customer_name,
        customer_tax_id: data.customer_tax_id,
        customer_email: data.customer_email || undefined,
        customer_phone_e164: data.customer_phone_e164 || undefined,
        billing_address: data.billing_address || undefined,
        term_months: product.term_months,
        currency: product.currency,
      });
      toast.success(`Contrato ${result.number} creado correctamente`);
      onComplete(result.id);
    } catch (err) {
      toast.error("Error al crear contrato", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  });

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Resumen del contrato</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Lead"
          value={lead ? `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim() : "-"}
          sub={lead?.email ?? lead?.phone_e164 ?? ""}
        />
        <SummaryCard
          label="CUPS"
          value={cups?.code ?? "-"}
          sub={cups?.address ?? ""}
        />
        <SummaryCard
          label="Producto"
          value={product?.name ?? "-"}
          sub={product ? `${product.term_months} meses` : ""}
        />
      </div>

      {quote && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Ahorro estimado: {quote.savings_eur} EUR/anio ({quote.savings_pct}%)
          </p>
        </div>
      )}

      {/* Customer data form */}
      <form onSubmit={handleCreate} className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Datos del cliente
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="cust-name" className="text-xs">Nombre completo *</Label>
            <Input id="cust-name" {...form.register("customer_name")} aria-invalid={Boolean(form.formState.errors.customer_name)} />
            {form.formState.errors.customer_name && (
              <p className="text-xs text-destructive">{form.formState.errors.customer_name.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="cust-tax" className="text-xs">NIF/CIF *</Label>
            <Input id="cust-tax" placeholder="12345678A" {...form.register("customer_tax_id")} aria-invalid={Boolean(form.formState.errors.customer_tax_id)} />
            {form.formState.errors.customer_tax_id && (
              <p className="text-xs text-destructive">{form.formState.errors.customer_tax_id.message}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="cust-email" className="text-xs">Email</Label>
            <Input id="cust-email" type="email" {...form.register("customer_email")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cust-phone" className="text-xs">Teléfono</Label>
            <Input id="cust-phone" {...form.register("customer_phone_e164")} />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="cust-address" className="text-xs">Dirección de facturación</Label>
          <Input id="cust-address" {...form.register("billing_address")} />
        </div>

        <Button
          type="submit"
          disabled={createContract.isPending}
          className="w-full"
          size="lg"
        >
          {createContract.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
          ) : (
            <FileText className="mr-2 size-4" aria-hidden />
          )}
          Crear contrato
        </Button>
      </form>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-medium text-sm">{value}</p>
        {sub && (
          <p className="truncate text-xs text-muted-foreground">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}
