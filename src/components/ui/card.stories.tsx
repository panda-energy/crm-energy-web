import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

const meta = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Contenedor estándar de bloques (KPIs, paneles, items de lista). Compuesto con subcomponentes (`CardHeader`, `CardContent`, `CardFooter`). Usa `bg-surface`, `border-border`, `shadow-1`.",
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Pipeline</CardTitle>
        <CardDescription>
          Vista Kanban + Tabla + Timeline llegan en Sprint 2.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          Actualmente tienes 0 oportunidades en juego. Configura tu primera
          fuente de leads para empezar.
        </p>
      </CardContent>
      <CardFooter className="justify-end">
        <Button size="sm">Configurar</Button>
      </CardFooter>
    </Card>
  ),
};

export const Minimal: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>KPI</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">142</p>
        <p className="text-xs text-muted-foreground">leads este mes</p>
      </CardContent>
    </Card>
  ),
};

export const Grid: Story = {
  render: () => (
    <div className="grid w-[640px] grid-cols-1 gap-4 sm:grid-cols-3">
      {["Pipeline", "ATR", "Tickets"].map((title) => (
        <Card key={title}>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              Texto descriptivo breve del módulo.
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  ),
};
