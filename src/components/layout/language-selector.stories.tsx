import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LanguageSelector } from "./language-selector";

const meta = {
  title: "Layout/LanguageSelector",
  component: LanguageSelector,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof LanguageSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Dropdown with globe icon showing ES/CA/PT locale options.
 */
export const Default: Story = {};
