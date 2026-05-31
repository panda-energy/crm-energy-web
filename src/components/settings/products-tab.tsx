"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  type Product,
} from "@/lib/api/hooks/use-products";
import { useTranslations } from "@/lib/i18n";
import { toast } from "@/lib/ui/toast";

// -- Types --------------------------------------------------------------------

const ProductFormSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  code: z.string().min(1, "El codigo es obligatorio").max(64),
  notes: z.string().optional(),
});

type ProductFormData = z.infer<typeof ProductFormSchema>;

type EnergyType = "electricity" | "gas";
type TariffKind = "fixed" | "indexed_omie" | "multi_period";
type ProductStatus = "draft" | "active" | "retired";

const ENERGY_TYPE_LABELS: Record<EnergyType, string> = {
  electricity: "Electricidad",
  gas: "Gas",
};

const TARIFF_LABELS: Record<TariffKind, string> = {
  fixed: "Fijo",
  indexed_omie: "Indexado OMIE",
  multi_period: "Multi-periodo",
};

const STATUS_COLORS: Record<ProductStatus, string> = {
  draft: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  retired: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400",
};

const STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "Borrador",
  active: "Activo",
  retired: "Retirado",
};

// -- Row actions component (hooks bound to product.id) ------------------------

function ProductRowActions({
  product,
  onEdit,
}: {
  product: Product;
  onEdit: () => void;
}) {
  const [open, setOpen] = useState(false);
  const updateProduct = useUpdateProduct(product.id);
  const deleteProduct = useDeleteProduct(product.id);

  const handleStatusChange = (status: ProductStatus) => {
    updateProduct.mutate({ status } as never, {
      onSuccess: () => {
        toast.success(
          `"${product.name}" ${status === "active" ? "activado" : status === "retired" ? "retirado" : "en borrador"}`,
        );
      },
      onError: () => toast.error("Error al cambiar estado"),
    });
    setOpen(false);
  };

  const handleDelete = () => {
    deleteProduct.mutate(undefined as never, {
      onSuccess: () => toast.success(`"${product.name}" eliminado`),
      onError: () => toast.error("Error al eliminar producto"),
    });
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="size-8 p-0"
        onClick={() => setOpen(!open)}
        aria-label={`Opciones para ${product.name}`}
      >
        <MoreHorizontal className="size-4" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-md border border-border bg-surface py-1 shadow-lg">
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
            onClick={() => {
              onEdit();
              setOpen(false);
            }}
          >
            <Pencil className="size-4" />
            Editar
          </button>
          {product.status === "draft" && (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-muted"
              onClick={() => handleStatusChange("active")}
            >
              <Power className="size-4" />
              Activar
            </button>
          )}
          {product.status === "active" && (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-muted"
              onClick={() => handleStatusChange("retired")}
            >
              <PowerOff className="size-4" />
              Retirar
            </button>
          )}
          {product.status === "retired" && (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-muted"
              onClick={() => handleStatusChange("active")}
            >
              <Power className="size-4" />
              Reactivar
            </button>
          )}
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-muted"
            onClick={handleDelete}
          >
            <Trash2 className="size-4" />
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

// -- Edit dialog (needs product.id for useUpdateProduct) ----------------------

function EditProductDialog({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const updateProduct = useUpdateProduct(product.id);
  const [energyType, setEnergyType] = useState<EnergyType>(
    product.energy_type as EnergyType,
  );
  const [tariffKind, setTariffKind] = useState<TariffKind>(
    product.tariff_kind as TariffKind,
  );
  const [termMonths, setTermMonths] = useState(String(product.term_months));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      name: product.name,
      code: product.code,
      notes: product.notes ?? "",
    },
  });

  const onSubmit = (formData: ProductFormData) => {
    updateProduct.mutate(
      {
        name: formData.name,
        energy_type: energyType,
        tariff_kind: tariffKind,
        term_months: parseInt(termMonths, 10),
        notes: formData.notes || null,
      } as never,
      {
        onSuccess: () => {
          toast.success(`Producto "${formData.name}" actualizado`);
          onClose();
        },
        onError: () => toast.error("Error al actualizar producto"),
      },
    );
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Editar producto</DialogTitle>
        <DialogDescription>Editando &ldquo;{product.name}&rdquo;</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="edit-product-name">Nombre</Label>
            <Input
              id="edit-product-name"
              {...register("name")}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-product-code">Codigo</Label>
            <Input id="edit-product-code" {...register("code")} disabled />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Tipo de energia</Label>
            <Select
              value={energyType}
              onValueChange={(v) => setEnergyType(v as EnergyType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="electricity">Electricidad</SelectItem>
                <SelectItem value="gas">Gas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo de tarifa</Label>
            <Select
              value={tariffKind}
              onValueChange={(v) => setTariffKind(v as TariffKind)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fijo</SelectItem>
                <SelectItem value="indexed_omie">Indexado OMIE</SelectItem>
                <SelectItem value="multi_period">Multi-periodo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-product-term">Duracion (meses)</Label>
            <Input
              id="edit-product-term"
              type="number"
              min="1"
              max="120"
              value={termMonths}
              onChange={(e) => setTermMonths(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-product-notes">Notas</Label>
          <Textarea
            id="edit-product-notes"
            rows={3}
            {...register("notes")}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={updateProduct.isPending}>
            {updateProduct.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// -- Main component -----------------------------------------------------------

export function ProductsTab() {
  const { t } = useTranslations();
  const { data, isLoading, error } = useProducts({ limit: 50 });
  const createProduct = useCreateProduct();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [energyType, setEnergyType] = useState<EnergyType>("electricity");
  const [tariffKind, setTariffKind] = useState<TariffKind>("fixed");
  const [termMonths, setTermMonths] = useState("12");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(ProductFormSchema),
  });

  const openCreate = () => {
    reset({ name: "", code: "", notes: "" });
    setEnergyType("electricity");
    setTariffKind("fixed");
    setTermMonths("12");
    setCreateOpen(true);
  };

  const onCreate = (formData: ProductFormData) => {
    createProduct.mutate(
      {
        name: formData.name,
        code: formData.code,
        energy_type: energyType,
        tariff_kind: tariffKind,
        term_months: parseInt(termMonths, 10),
        notes: formData.notes || undefined,
      } as never,
      {
        onSuccess: () => {
          toast.success(`Producto "${formData.name}" creado`);
          setCreateOpen(false);
          reset();
        },
        onError: () => toast.error("Error al crear producto"),
      },
    );
  };

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

  return (
    <>
      {products.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title={t("empty.products")}
          description="Crea tu primer producto energetico para empezar a generar contratos."
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 size-4" aria-hidden="true" />
              Crear producto
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Catalogo de productos</CardTitle>
              <CardDescription>
                {products.length} productos registrados
              </CardDescription>
            </div>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 size-4" aria-hidden="true" />
              Crear producto
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm"
                aria-label="Catalogo de productos"
              >
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Codigo</th>
                    <th className="px-3 py-2 font-medium">Nombre</th>
                    <th className="px-3 py-2 font-medium">Tipo</th>
                    <th className="px-3 py-2 font-medium">Tarifa</th>
                    <th className="px-3 py-2 font-medium">Duracion</th>
                    <th className="px-3 py-2 font-medium">Estado</th>
                    <th className="px-3 py-2 font-medium sr-only">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer"
                      onClick={() => setEditingProduct(product)}
                    >
                      <td className="px-3 py-2.5 font-mono text-xs">
                        {product.code}
                      </td>
                      <td className="px-3 py-2.5 font-medium">
                        {product.name}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant="secondary" className="text-xs">
                          {ENERGY_TYPE_LABELS[product.energy_type as EnergyType] ?? product.energy_type}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {TARIFF_LABELS[product.tariff_kind as TariffKind] ?? product.tariff_kind}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {product.term_months} meses
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge
                          className={`text-xs border-0 ${STATUS_COLORS[product.status as ProductStatus] ?? ""}`}
                        >
                          {STATUS_LABELS[product.status as ProductStatus] ?? product.status}
                        </Badge>
                      </td>
                      <td
                        className="px-3 py-2.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ProductRowActions
                          product={product}
                          onEdit={() => setEditingProduct(product)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear producto</DialogTitle>
            <DialogDescription>
              Define un nuevo producto energetico para tu catalogo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-name">Nombre</Label>
                <Input
                  id="product-name"
                  placeholder="Tarifa Hogar Plus"
                  {...register("name")}
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-code">Codigo</Label>
                <Input
                  id="product-code"
                  placeholder="HOGAR-PLUS-01"
                  {...register("code")}
                  aria-invalid={Boolean(errors.code)}
                />
                {errors.code && (
                  <p className="text-xs text-red-500">{errors.code.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Tipo de energia</Label>
                <Select
                  value={energyType}
                  onValueChange={(v) => setEnergyType(v as EnergyType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electricity">Electricidad</SelectItem>
                    <SelectItem value="gas">Gas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de tarifa</Label>
                <Select
                  value={tariffKind}
                  onValueChange={(v) => setTariffKind(v as TariffKind)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fijo</SelectItem>
                    <SelectItem value="indexed_omie">Indexado OMIE</SelectItem>
                    <SelectItem value="multi_period">Multi-periodo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-term">Duracion (meses)</Label>
                <Input
                  id="product-term"
                  type="number"
                  min="1"
                  max="120"
                  value={termMonths}
                  onChange={(e) => setTermMonths(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-notes">Notas</Label>
              <Textarea
                id="product-notes"
                placeholder="Descripcion interna, condiciones especiales..."
                rows={3}
                {...register("notes")}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createProduct.isPending}>
                {createProduct.isPending ? "Creando..." : "Crear producto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog (separate component to bind useUpdateProduct to product.id) */}
      <Dialog
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
      >
        {editingProduct && (
          <EditProductDialog
            product={editingProduct}
            onClose={() => setEditingProduct(null)}
          />
        )}
      </Dialog>
    </>
  );
}
