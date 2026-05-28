import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DemoBanner } from "./demo-banner";

const meta = {
  title: "Layout/DemoBanner",
  component: DemoBanner,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof DemoBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * DemoBanner shows when Clerk keys are not configured.
 * In Storybook (no Clerk env), it always renders.
 */
export const Default: Story = {};
