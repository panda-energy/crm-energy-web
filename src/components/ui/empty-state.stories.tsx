import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Search, Users, Zap } from "lucide-react";
import { Button } from "./button";
import { EmptyState } from "./empty-state";

const meta = {
  title: "UI/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Placeholder visual para listas/tablas sin resultados. Sigue el patrón UX obligatorio del backlog: ilustración + título + descripción + CTA. `role=\"status\"` para anuncio a SR cuando aparece tras un filtro.",
      },
    },
    layout: "padded",
  },
  args: {
    title: "Sin resultados",
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-[640px]">
      <EmptyState
        icon={<Users />}
        title="Aún no hay leads"
        description="Crea el primero o conecta una fuente para que lleguen solos."
        action={<Button>Crear lead</Button>}
      />
    </div>
  ),
};

export const NoSearchResults: Story = {
  name: "Sin resultados de búsqueda",
  render: () => (
    <div className="w-[640px]">
      <EmptyState
        icon={<Search />}
        title="No encontramos nada"
        description="Prueba con otro término o limpia los filtros."
        action={
          <Button variant="outline" size="sm">
            Limpiar filtros
          </Button>
        }
      />
    </div>
  ),
};

export const Minimal: Story = {
  name: "Sin icono ni acción",
  render: () => (
    <div className="w-[640px]">
      <EmptyState title="Sin actividad reciente" />
    </div>
  ),
};

export const Onboarding: Story = {
  name: "Onboarding (first time)",
  render: () => (
    <div className="w-[640px]">
      <EmptyState
        icon={<Zap />}
        title="Bienvenido a Panda Energy"
        description="Configura tu primera comercializadora para empezar a capturar leads, gestionar pipelines y monitorizar ATR."
        action={<Button>Empezar configuración</Button>}
      />
    </div>
  ),
};
