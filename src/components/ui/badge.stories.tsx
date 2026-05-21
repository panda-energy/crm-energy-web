import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Etiqueta compacta para estado/categoría. Cubre los estados que necesitan Leads (nuevo/cualificado/perdido), ATR (pendiente/aceptado/rechazado) y Tickets (abierto/cerrado).",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "secondary",
        "outline",
        "destructive",
        "success",
        "warning",
      ],
    },
  },
  args: {
    children: "Etiqueta",
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Ganado</Badge>
      <Badge variant="warning">Pendiente</Badge>
      <Badge variant="destructive">Perdido</Badge>
    </div>
  ),
};

export const LeadStatuses: Story = {
  name: "Casos reales (estados de Lead)",
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Nuevo</Badge>
      <Badge variant="secondary">Cualificado</Badge>
      <Badge variant="warning">Contactado</Badge>
      <Badge variant="success">Ganado</Badge>
      <Badge variant="destructive">Perdido</Badge>
    </div>
  ),
};
