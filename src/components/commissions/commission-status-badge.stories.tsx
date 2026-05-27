import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CommissionStatusBadge } from "./commission-status-badge";

const meta = {
  title: "Commissions/CommissionStatusBadge",
  component: CommissionStatusBadge,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Badge de estado para comisiones: pendiente (warning), aprobada (brand), pagada (success), cancelada (destructive).",
      },
    },
  },
} satisfies Meta<typeof CommissionStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = { args: { status: "pending" } };
export const Approved: Story = { args: { status: "approved" } };
export const Paid: Story = { args: { status: "paid" } };
export const Cancelled: Story = { args: { status: "cancelled" } };
