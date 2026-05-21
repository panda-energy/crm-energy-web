import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

const meta = {
  title: "UI/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Wrapper sobre Radix Dialog. Radix maneja focus trap, ESC y click-outside automáticamente. Las confirmaciones destructivas siguen la copy recomendada del DoD: \"Eliminar contrato CUPS XXX. Esta acción no se puede deshacer.\"",
      },
    },
    layout: "padded",
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Abrir diálogo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear nuevo lead</DialogTitle>
          <DialogDescription>
            Rellena los datos básicos del lead. Podrás añadir más información
            después.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          (Aquí iría el formulario en el componente real.)
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button>Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const Destructive: Story = {
  name: "Confirmación destructiva",
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Eliminar contrato</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Eliminar contrato CUPS ES0021000000123456AB
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. El contrato se archivará y
            cualquier flujo ATR en curso se cancelará.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button variant="destructive">Eliminar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const Loading: Story = {
  name: "Estado de envío (loading)",
  render: () => (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviando contrato a firma…</DialogTitle>
          <DialogDescription>
            No cierres esta ventana. Te avisaremos cuando el cliente firme.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button disabled>Procesando…</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
