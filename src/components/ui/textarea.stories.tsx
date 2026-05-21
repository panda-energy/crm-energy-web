import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Textarea } from "./textarea";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Textarea con tokens. Usado en formulario crear lead, notas de actividades y campos largos del wizard de contratos.",
      },
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "Escribe una nota interna…", rows: 4 },
};

export const Filled: Story = {
  args: {
    defaultValue:
      "Lead contactado por LinkedIn. Interesado en cambio a Indexada Plus. Llamar la próxima semana.",
    rows: 4,
  },
};

export const Disabled: Story = {
  args: { disabled: true, placeholder: "Bloqueado durante el envío…", rows: 3 },
};
