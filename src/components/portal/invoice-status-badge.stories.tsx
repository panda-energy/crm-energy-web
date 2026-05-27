import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InvoiceStatusBadge } from "./invoice-status-badge";

const meta = {
  title: "Portal/InvoiceStatusBadge",
  component: InvoiceStatusBadge,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Badge de estado para facturas del portal cliente: pagada (success), pendiente (warning), vencida (destructive).",
      },
    },
  },
} satisfies Meta<typeof InvoiceStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Paid: Story = { args: { status: "paid" } };
export const Pending: Story = { args: { status: "pending" } };
export const Overdue: Story = { args: { status: "overdue" } };
