"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreatePowerModification } from "@/lib/api/hooks/use-portal";

/**
 * PowerForm -- form to request power modification.
 *
 * Shows current power (readonly) and inputs for requested power.
 * Validates with Zod: power > 0, max 6 periods.
 */

const PowerFormSchema = z.object({
  p1: z.coerce.number().positive("Potencia P1 debe ser > 0"),
  p2: z.coerce.number().positive("Potencia P2 debe ser > 0"),
});

type PowerFormValues = z.infer<typeof PowerFormSchema>;

export interface PowerFormProps {
  contractId: string;
  cupsCode: string;
  currentPower: number[];
}

export function PowerForm({
  contractId,
  cupsCode,
  currentPower,
}: PowerFormProps) {
  const createMutation = useCreatePowerModification();

  const form = useForm<PowerFormValues>({
    resolver: zodResolver(PowerFormSchema),
    defaultValues: {
      p1: currentPower[0] ?? 0,
      p2: currentPower[1] ?? currentPower[0] ?? 0,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await createMutation.mutateAsync({
      contract_id: contractId,
      cups_code: cupsCode,
      requested_power_kw: [values.p1, values.p2],
    });
    form.reset();
  });

  const errors = form.formState.errors;
  const isSubmitting = createMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Solicitar modificacion de potencia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Current power (readonly) */}
          <div className="rounded-md bg-muted/50 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Potencias actuales
            </p>
            <div className="grid grid-cols-2 gap-3">
              {currentPower.map((kw, i) => (
                <div key={i} className="space-y-1">
                  <Label className="text-xs">P{i + 1}</Label>
                  <Input
                    value={`${kw} kW`}
                    readOnly
                    disabled
                    className="bg-muted"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Requested power */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              Potencias solicitadas
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="power-p1" className="text-xs">
                  P1 (kW)
                </Label>
                <Input
                  id="power-p1"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register("p1")}
                  aria-invalid={Boolean(errors.p1)}
                />
                {errors.p1 ? (
                  <p role="alert" className="text-xs text-danger">
                    {errors.p1.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1">
                <Label htmlFor="power-p2" className="text-xs">
                  P2 (kW)
                </Label>
                <Input
                  id="power-p2"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register("p2")}
                  aria-invalid={Boolean(errors.p2)}
                />
                {errors.p2 ? (
                  <p role="alert" className="text-xs text-danger">
                    {errors.p2.message}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            CUPS: {cupsCode}
          </p>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            ) : null}
            Enviar solicitud
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
