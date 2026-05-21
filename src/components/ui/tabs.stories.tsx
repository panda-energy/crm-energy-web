import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta = {
  title: "UI/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Tabs Radix con tokens. Caso real: detalle de Lead (info / actividades / notas).",
      },
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { defaultValue: "info" },
  render: (args) => (
    <Tabs {...args} className="w-[480px]">
      <TabsList>
        <TabsTrigger value="info">Info</TabsTrigger>
        <TabsTrigger value="actividades">Actividades</TabsTrigger>
        <TabsTrigger value="notas">Notas</TabsTrigger>
      </TabsList>
      <TabsContent value="info" className="rounded-md border border-border p-4 text-sm">
        Datos de contacto, empresa, etiquetas, …
      </TabsContent>
      <TabsContent value="actividades" className="rounded-md border border-border p-4 text-sm">
        Timeline de llamadas, emails y mensajes WhatsApp.
      </TabsContent>
      <TabsContent value="notas" className="rounded-md border border-border p-4 text-sm">
        Notas internas del equipo.
      </TabsContent>
    </Tabs>
  ),
};
