import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TicketStatusBadge } from "./ticket-status-badge";
import type { TicketStatus } from "@/lib/api/types-sprint4";

const meta: Meta<typeof TicketStatusBadge> = {
  title: "Sprint 4/TicketStatusBadge",
  component: TicketStatusBadge,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TicketStatusBadge>;

export const Open: Story = { args: { status: "open" } };
export const InProgress: Story = { args: { status: "in_progress" } };
export const WaitingCustomer: Story = { args: { status: "waiting_customer" } };
export const Resolved: Story = { args: { status: "resolved" } };
export const Closed: Story = { args: { status: "closed" } };

export const AllStatuses: Story = {
  render: () => {
    const statuses: TicketStatus[] = [
      "open",
      "in_progress",
      "waiting_customer",
      "resolved",
      "closed",
    ];
    return (
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <TicketStatusBadge key={s} status={s} />
        ))}
      </div>
    );
  },
};
