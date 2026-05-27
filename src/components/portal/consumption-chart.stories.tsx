import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ConsumptionChart } from "./consumption-chart";
import { CONSUMPTION_FIXTURES } from "@/mocks/fixtures/sprint5";

const meta = {
  title: "Portal/ConsumptionChart",
  component: ConsumptionChart,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Grafico de barras dual del consumo mensual del cliente: eje izquierdo kWh, eje derecho EUR.",
      },
    },
  },
} satisfies Meta<typeof ConsumptionChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwelveMonths: Story = {
  args: {
    data: CONSUMPTION_FIXTURES,
  },
};

export const Empty: Story = {
  args: {
    data: [],
  },
};
