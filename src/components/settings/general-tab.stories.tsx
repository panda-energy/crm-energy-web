import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GeneralTab } from "./general-tab";

const meta = {
  title: "Settings/GeneralTab",
  component: GeneralTab,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof GeneralTab>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Company settings form with name, CIF, address, phone, email.
 */
export const Default: Story = {};
