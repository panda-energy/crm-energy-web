import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChatMessage, ChatDateSeparator } from "./chat-message";
import type { TicketMessage } from "@/lib/api/types-sprint4";

const meta: Meta<typeof ChatMessage> = {
  title: "Sprint 4/ChatMessage",
  component: ChatMessage,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-lg p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatMessage>;

const baseMsg: TicketMessage = {
  id: "99999999-9999-9999-9999-990000000101",
  ticket_id: "99999999-9999-9999-9999-990000000001",
  sender_type: "customer",
  sender_id: null,
  body: "Buenos dias, me ha llegado una factura incorrecta.",
  channel: "whatsapp",
  created_at: "2026-05-27T08:00:00.000Z",
};

export const CustomerMessage: Story = {
  args: { message: baseMsg },
};

export const AgentMessage: Story = {
  args: {
    message: {
      ...baseMsg,
      sender_type: "agent",
      sender_id: "55555555-5555-4555-8555-550000000006",
      body: "Buenos dias. Estoy revisando su factura ahora mismo.",
    },
  },
};

export const SystemMessage: Story = {
  args: {
    message: {
      ...baseMsg,
      sender_type: "system",
      body: "Ticket creado automaticamente desde WhatsApp.",
    },
  },
};

export const LongMessage: Story = {
  args: {
    message: {
      ...baseMsg,
      body: "Este es un mensaje largo que deberia ocupar varias lineas en la interfaz. Quiero explicar con detalle mi problema: la factura del mes de mayo incluye un cargo de regularizacion de 130 EUR que no estaba previsto en mi contrato. Ademas, las lecturas del contador no coinciden con las que tengo apuntadas.",
    },
  },
};

export const EmailChannel: Story = {
  args: {
    message: { ...baseMsg, channel: "email" },
  },
};

export const ConversationThread: Story = {
  render: () => (
    <div className="space-y-1">
      <ChatDateSeparator date="2026-05-27T00:00:00.000Z" />
      <ChatMessage message={baseMsg} />
      <ChatMessage
        message={{
          ...baseMsg,
          id: "99999999-9999-9999-9999-990000000102",
          sender_type: "system",
          body: "Ticket asignado a Jorge Vega.",
          created_at: "2026-05-27T08:01:00.000Z",
        }}
      />
      <ChatMessage
        message={{
          ...baseMsg,
          id: "99999999-9999-9999-9999-990000000103",
          sender_type: "agent",
          sender_id: "55555555-5555-4555-8555-550000000006",
          body: "Buenos dias. Voy a revisar su factura.",
          created_at: "2026-05-27T08:15:00.000Z",
        }}
      />
    </div>
  ),
};
