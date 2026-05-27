import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TicketChannelIcon } from "./ticket-channel-icon";
import type { TicketChannel } from "@/lib/api/types-sprint4";

const meta: Meta<typeof TicketChannelIcon> = {
  title: "Sprint 4/TicketChannelIcon",
  component: TicketChannelIcon,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TicketChannelIcon>;

export const WhatsApp: Story = { args: { channel: "whatsapp" } };
export const Email: Story = { args: { channel: "email" } };
export const Chat: Story = { args: { channel: "chat" } };
export const Phone: Story = { args: { channel: "phone" } };

export const WithLabel: Story = {
  args: { channel: "whatsapp", showLabel: true },
};

export const AllChannels: Story = {
  render: () => {
    const channels: TicketChannel[] = ["whatsapp", "email", "chat", "phone"];
    return (
      <div className="flex flex-col gap-3">
        {channels.map((c) => (
          <TicketChannelIcon key={c} channel={c} showLabel />
        ))}
      </div>
    );
  },
};
