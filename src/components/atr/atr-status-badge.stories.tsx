import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AtrStatusBadge } from "./atr-status-badge";
import type { AtrMessageStatus } from "@/lib/api/types-sprint4";

const meta: Meta<typeof AtrStatusBadge> = {
  title: "Sprint 4/AtrStatusBadge",
  component: AtrStatusBadge,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AtrStatusBadge>;

export const Pending: Story = { args: { status: "pending" } };
export const Sent: Story = { args: { status: "sent" } };
export const AckReceived: Story = { args: { status: "ack_received" } };
export const Processed: Story = { args: { status: "processed" } };
export const Rejected: Story = { args: { status: "rejected" } };
export const Timeout: Story = { args: { status: "timeout" } };

export const AllStatuses: Story = {
  render: () => {
    const statuses: AtrMessageStatus[] = [
      "pending",
      "sent",
      "ack_received",
      "processed",
      "rejected",
      "timeout",
    ];
    return (
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <AtrStatusBadge key={s} status={s} />
        ))}
      </div>
    );
  },
};
