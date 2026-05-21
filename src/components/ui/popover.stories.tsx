import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const meta = {
  title: "UI/Popover",
  component: Popover,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Popover Radix portaled. Casos reales: filtros multi-select de leads, popover de bulk actions (asignar owner, cambiar status, etiquetas).",
      },
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Abrir</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-sm">Contenido del popover.</p>
      </PopoverContent>
    </Popover>
  ),
};

export const FilterPattern: Story = {
  name: "Patrón filtro multi-select",
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          Estado · 2
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Filtrar por estado
        </p>
        <ul className="space-y-1 text-sm">
          <li>· Nuevo</li>
          <li>· Contactado ✓</li>
          <li>· Cualificado</li>
          <li>· Ganado ✓</li>
          <li>· Perdido</li>
        </ul>
      </PopoverContent>
    </Popover>
  ),
};
