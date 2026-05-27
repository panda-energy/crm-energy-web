import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SlaTimer } from "./sla-timer";

const meta: Meta<typeof SlaTimer> = {
  title: "Sprint 4/SlaTimer",
  component: SlaTimer,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SlaTimer>;

export const FarFuture: Story = {
  args: {
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    breached: false,
  },
};

export const FewHours: Story = {
  args: {
    deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    breached: false,
  },
};

export const Breached: Story = {
  args: {
    deadline: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    breached: true,
  },
};

export const NoDeadline: Story = {
  args: { deadline: null, breached: false },
};
