import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CommissionChart } from "./commission-chart";
import { COMMISSION_FIXTURES } from "@/mocks/fixtures/sprint5";

const meta = {
  title: "Commissions/CommissionChart",
  component: CommissionChart,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Grafico de barras mensual de comisiones (ultimos 6 meses). Muestra pagado, aprobado y pendiente.",
      },
    },
  },
} satisfies Meta<typeof CommissionChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithData: Story = {
  args: {
    commissions: COMMISSION_FIXTURES,
  },
};

export const Empty: Story = {
  args: {
    commissions: [],
  },
};
