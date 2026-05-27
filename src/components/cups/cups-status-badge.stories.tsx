import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CupsStatusBadge } from "./cups-status-badge";

const meta = {
  title: "CUPS/CupsStatusBadge",
  component: CupsStatusBadge,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Badge de estado de punto de suministro (CUPS). 4 estados: borrador, activo, en cambio (switching), inactivo.",
      },
    },
  },
  argTypes: {
    status: {
      control: "select",
      options: ["draft", "active", "switching", "inactive"],
    },
  },
  args: {
    status: "active",
  },
} satisfies Meta<typeof CupsStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllStatuses: Story = {
  name: "Todos los estados",
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <CupsStatusBadge status="draft" />
      <CupsStatusBadge status="active" />
      <CupsStatusBadge status="switching" />
      <CupsStatusBadge status="inactive" />
    </div>
  ),
};
