import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TicketPriorityBadge } from "./ticket-priority-badge";
import type { TicketPriority } from "@/lib/api/types-sprint4";

const meta: Meta<typeof TicketPriorityBadge> = {
  title: "Sprint 4/TicketPriorityBadge",
  component: TicketPriorityBadge,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TicketPriorityBadge>;

export const Low: Story = { args: { priority: "low" } };
export const Medium: Story = { args: { priority: "medium" } };
export const High: Story = { args: { priority: "high" } };
export const Urgent: Story = { args: { priority: "urgent" } };

export const AllPriorities: Story = {
  render: () => {
    const priorities: TicketPriority[] = ["low", "medium", "high", "urgent"];
    return (
      <div className="flex flex-wrap gap-2">
        {priorities.map((p) => (
          <TicketPriorityBadge key={p} priority={p} />
        ))}
      </div>
    );
  },
};
