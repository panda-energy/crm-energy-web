import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PowerForm } from "./power-form";

const meta = {
  title: "Portal/PowerForm",
  component: PowerForm,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Formulario de solicitud de modificacion de potencia. Muestra potencias actuales (readonly) e inputs para las solicitadas.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PowerForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    contractId: "77777777-7777-7777-7777-770000000001",
    cupsCode: "ES0021000000350832AJ",
    currentPower: [5.75, 5.75],
  },
};

export const SixPeriods: Story = {
  args: {
    contractId: "77777777-7777-7777-7777-770000000002",
    cupsCode: "ES0031000000123456BC",
    currentPower: [10.0, 10.0, 15.0, 15.0, 20.0, 20.0],
  },
};
