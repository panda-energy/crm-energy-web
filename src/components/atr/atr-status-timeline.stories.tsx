import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AtrStatusTimeline } from "./atr-status-timeline";
import type { AtrMessage } from "@/lib/api/types-sprint4";

const baseMessage: AtrMessage = {
  id: "88888888-8888-8888-8888-880000000001",
  tenant_id: "11111111-1111-1111-1111-111111111111",
  contract_id: "77777777-7777-7777-7777-770000000001",
  cups_code: "ES0021000011223344AA",
  message_type: "C1",
  status: "pending",
  distributor: "e-distribucion",
  external_id: null,
  retry_count: 0,
  max_retries: 3,
  last_error: null,
  xml_storage_key: "atr/c1-001.xml",
  xsd_version: "3.1",
  created_at: "2026-05-15T08:00:00.000Z",
  updated_at: "2026-05-15T08:00:00.000Z",
  sent_at: null,
  ack_at: null,
  processed_at: null,
};

const meta: Meta<typeof AtrStatusTimeline> = {
  title: "Sprint 4/AtrStatusTimeline",
  component: AtrStatusTimeline,
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
type Story = StoryObj<typeof AtrStatusTimeline>;

export const Pending: Story = {
  args: { message: { ...baseMessage, status: "pending" } },
};

export const Sent: Story = {
  args: {
    message: {
      ...baseMessage,
      status: "sent",
      sent_at: "2026-05-15T09:00:00.000Z",
    },
  },
};

export const AckReceived: Story = {
  args: {
    message: {
      ...baseMessage,
      status: "ack_received",
      sent_at: "2026-05-15T09:00:00.000Z",
      ack_at: "2026-05-15T09:05:00.000Z",
    },
  },
};

export const Processed: Story = {
  args: {
    message: {
      ...baseMessage,
      status: "processed",
      sent_at: "2026-05-15T09:00:00.000Z",
      ack_at: "2026-05-15T09:05:00.000Z",
      processed_at: "2026-05-16T10:00:00.000Z",
    },
  },
};

export const Rejected: Story = {
  args: {
    message: {
      ...baseMessage,
      status: "rejected",
      sent_at: "2026-05-15T09:00:00.000Z",
      ack_at: "2026-05-15T09:05:00.000Z",
      last_error: "Error 05: CUPS no encontrado en sistema distribuidora",
      retry_count: 2,
    },
  },
};

export const Timeout: Story = {
  args: {
    message: {
      ...baseMessage,
      status: "timeout",
      sent_at: "2026-05-10T09:00:00.000Z",
      last_error: "Timeout tras 72h sin respuesta de distribuidora",
      retry_count: 3,
    },
  },
};
