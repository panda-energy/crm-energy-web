import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChannelCard } from "./channel-card";
import type { Channel } from "@/lib/api/types-sprint5";

const meta = {
  title: "Commissions/ChannelCard",
  component: ChannelCard,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Card visual para un canal de ventas. Muestra tipo (badge), tasa comision, nro agentes y toggle activo/inactivo.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChannelCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseChannel: Channel = {
  id: "88888888-8888-4888-8888-88cc00000001",
  tenant_id: "11111111-1111-4111-8111-111111111111",
  name: "Venta Directa",
  type: "direct",
  parent_id: null,
  commission_rate_pct: 3.0,
  active: true,
  agents_count: 4,
  created_at: "2026-01-15T10:00:00.000Z",
};

export const Active: Story = {
  args: {
    channel: baseChannel,
  },
};

export const Inactive: Story = {
  args: {
    channel: { ...baseChannel, name: "Agencia Barcelona (inactiva)", active: false, agents_count: 0 },
  },
};

export const ChildChannel: Story = {
  args: {
    channel: {
      ...baseChannel,
      name: "Agencia Centro (sub-Madrid)",
      type: "agency",
      parent_id: "parent-id",
    },
    isChild: true,
  },
};

export const PartnerChannel: Story = {
  args: {
    channel: {
      ...baseChannel,
      name: "Partner Energia Solar",
      type: "partner",
      commission_rate_pct: 1.5,
      agents_count: 2,
    },
  },
};
