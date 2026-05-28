import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BrandTab } from "./brand-tab";

const meta = {
  title: "Settings/BrandTab",
  component: BrandTab,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof BrandTab>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Logo upload + color pickers + mini sidebar preview.
 */
export const Default: Story = {};
