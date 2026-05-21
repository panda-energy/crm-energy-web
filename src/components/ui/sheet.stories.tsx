import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

const meta = {
  title: "UI/Sheet",
  component: Sheet,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Drawer lateral basado en Radix Dialog. Lo usaremos para el panel de detalle de Lead, sidebar mobile colapsable, y paneles auxiliares en general. Para el patrón drag-to-dismiss del portal cliente se reservará `vaul`.",
      },
    },
    layout: "padded",
  },
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Right: Story = {
  name: "Sheet (right)",
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Abrir detalle</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Detalle de lead</SheetTitle>
          <SheetDescription>
            Información del lead seleccionado. Las acciones rápidas viven en
            el footer.
          </SheetDescription>
        </SheetHeader>
        <p className="mt-6 text-sm text-muted-foreground">
          (Aquí iría el panel real con tabs Info / Actividades / Notas.)
        </p>
        <SheetFooter className="mt-6">
          <SheetClose asChild>
            <Button variant="outline">Cerrar</Button>
          </SheetClose>
          <Button>Editar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const Left: Story = {
  name: "Sheet (left) — sidebar mobile",
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Abrir menú</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navegación</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1">
          {["Dashboard", "Leads", "Pipeline", "Contratos", "ATR", "Tickets"].map(
            (item) => (
              <button
                key={item}
                type="button"
                className="rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
              >
                {item}
              </button>
            ),
          )}
        </nav>
      </SheetContent>
    </Sheet>
  ),
};

export const Bottom: Story = {
  name: "Sheet (bottom)",
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Acciones</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Bulk actions</SheetTitle>
          <SheetDescription>
            Aplicar acción a los leads seleccionados (Sprint 2).
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm">
            Asignar
          </Button>
          <Button variant="outline" size="sm">
            Cambiar estado
          </Button>
          <Button variant="destructive" size="sm">
            Eliminar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  ),
};
