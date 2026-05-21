import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Loader2, Plus } from "lucide-react";
import { Button } from "./button";

/**
 * Botón base del CRM. Compatible con `asChild` (Radix Slot) para envolver
 * un `<Link>` de Next y heredar variantes sin perder tipado.
 */
const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Botón base del CRM con variantes y sizes del design system. Usa tokens (`bg-brand`, `bg-danger`, etc.) — nada hardcoded. `asChild` permite envolverlo con `<Link>` o cualquier componente compatible con Slot.",
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
        "ghost",
        "destructive",
        "link",
      ],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "icon"],
    },
    disabled: { control: "boolean" },
  },
  args: {
    children: "Acción",
    variant: "default",
    size: "md",
    disabled: false,
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Primario</Button>
      <Button variant="secondary">Secundario</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Eliminar</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Crear">
        <Plus aria-hidden />
      </Button>
    </div>
  ),
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Plus aria-hidden /> Crear lead
      </>
    ),
  },
};

export const Loading: Story = {
  name: "Loading (spinner inline)",
  args: {
    disabled: true,
    children: (
      <>
        <Loader2 className="animate-spin" aria-hidden /> Enviando…
      </>
    ),
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Destructive: Story = {
  args: { variant: "destructive", children: "Eliminar contrato" },
};
