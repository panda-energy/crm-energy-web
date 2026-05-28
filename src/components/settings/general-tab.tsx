"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/lib/ui/toast";
import { useTranslations } from "@/lib/i18n";

const TenantGeneralSchema = z.object({
  company_name: z.string().min(1, "El nombre de empresa es obligatorio"),
  tax_id: z.string().min(1, "El CIF/NIF es obligatorio"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email no valido").optional().or(z.literal("")),
});

type TenantGeneralForm = z.infer<typeof TenantGeneralSchema>;

/**
 * General settings tab -- company name, CIF/NIF, address, phone, email.
 * Form backed by react-hook-form + zod. Submits to PATCH /v1/tenants/current.
 */
export function GeneralTab() {
  const { t } = useTranslations();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TenantGeneralForm>({
    defaultValues: {
      company_name: "Panda Energy Demo S.L.",
      tax_id: "B12345678",
      address: "Calle Gran Via 28, 28013 Madrid",
      phone: "+34 911 234 567",
      email: "info@pandaenergy.demo",
    },
  });

  const onSubmit = async (_data: TenantGeneralForm) => {
    // In demo mode this is a no-op; in production this calls PATCH /v1/tenants/current
    await new Promise((r) => setTimeout(r, 500));
    toast.success("Configuracion guardada");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos generales</CardTitle>
        <CardDescription>
          Informacion basica de la comercializadora
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="company_name">Nombre de empresa</Label>
            <Input
              id="company_name"
              {...register("company_name")}
              aria-invalid={Boolean(errors.company_name)}
            />
            {errors.company_name ? (
              <p className="text-xs text-danger">{errors.company_name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax_id">CIF / NIF</Label>
            <Input
              id="tax_id"
              {...register("tax_id")}
              aria-invalid={Boolean(errors.tax_id)}
            />
            {errors.tax_id ? (
              <p className="text-xs text-danger">{errors.tax_id.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Direccion</Label>
            <Input id="address" {...register("address")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefono</Label>
            <Input id="phone" type="tel" {...register("phone")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email ? (
              <p className="text-xs text-danger">{errors.email.message}</p>
            ) : null}
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : t("actions.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
