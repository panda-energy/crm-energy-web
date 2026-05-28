import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { IntegrationsTab } from "./integrations-tab";

const meta = {
  title: "Settings/IntegrationsTab",
  component: IntegrationsTab,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof IntegrationsTab>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Grid of integration cards showing connected/disconnected status.
 */
export const Default: Story = {};
