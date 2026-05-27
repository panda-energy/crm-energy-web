"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/ui/toast";
import { useCreateCup } from "@/lib/api/hooks/use-cups";
import { CupsCreateSchema, type CupsCreate } from "@/lib/api/zod-schemas";

interface CreateCupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCupsDialog({
  open,
  onOpenChange,
}: CreateCupsDialogProps) {
  const form = useForm<CupsCreate>({
    resolver: zodResolver(CupsCreateSchema),
    defaultValues: {
      code: "",
      energy_type: "electricity",
    },
  });

  const createCup = useCreateCup();

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      // reason: energy_type is required by the OpenAPI but defaults to
      // 'electricity' server-side. Ensure it's always present for type safety.
      await createCup.mutateAsync({
        ...data,
        energy_type: data.energy_type ?? "electricity",
      });
      toast.success("CUPS creado correctamente");
      form.reset();
      onOpenChange(false);
    } catch (err) {
      toast.error("Error al crear CUPS", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Nuevo CUPS</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cups-code">Código CUPS *</Label>
            <Input
              id="cups-code"
              placeholder="ES0021000011223344AA"
              {...form.register("code")}
              aria-invalid={Boolean(form.formState.errors.code)}
            />
            {form.formState.errors.code && (
              <p className="text-sm text-destructive">
                {form.formState.errors.code.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cups-energy-type">Tipo de energía</Label>
              <Select
                value={form.watch("energy_type") ?? "electricity"}
                onValueChange={(v) =>
                  form.setValue(
                    "energy_type",
                    v as "electricity" | "gas",
                    { shouldValidate: true },
                  )
                }
              >
                <SelectTrigger id="cups-energy-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electricity">Electricidad</SelectItem>
                  <SelectItem value="gas">Gas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cups-tariff">Tarifa de acceso</Label>
              <Input
                id="cups-tariff"
                placeholder="2.0TD"
                {...form.register("tariff_access_code")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cups-address">Dirección</Label>
            <Input
              id="cups-address"
              placeholder="Calle, número, piso"
              {...form.register("address")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cups-city">Ciudad</Label>
              <Input
                id="cups-city"
                placeholder="Madrid"
                {...form.register("city")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cups-postal">Código postal</Label>
              <Input
                id="cups-postal"
                placeholder="28001"
                {...form.register("postal_code")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cups-distributor">Distribuidora</Label>
            <Input
              id="cups-distributor"
              placeholder="Iberdrola Distribución"
              {...form.register("distributor_name")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createCup.isPending}
            >
              {createCup.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              )}
              Crear CUPS
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
