import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ToolCallCard } from "./tool-call-card";
import type { ToolCall } from "@/lib/api/types-sprint5";

const meta = {
  title: "AI Chat/ToolCallCard",
  component: ToolCallCard,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Card de accion del agente IA con aprobacion/rechazo humana. Muestra icono, argumentos y botones de accion segun el estado.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ToolCallCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const pendingToolCall: ToolCall = {
  id: "88888888-8888-4888-8888-88aa00000001",
  name: "create_lead",
  arguments: {
    first_name: "Maria",
    last_name: "Garcia",
    email: "mgarcia@empresa.com",
  },
  status: "pending_approval",
};

const executedToolCall: ToolCall = {
  ...pendingToolCall,
  status: "executed",
  result: "Lead creado correctamente con ID abc123.",
};

const rejectedToolCall: ToolCall = {
  ...pendingToolCall,
  status: "rejected",
};

export const PendingApproval: Story = {
  args: {
    toolCall: pendingToolCall,
  },
};

export const Executed: Story = {
  args: {
    toolCall: executedToolCall,
  },
};

export const Rejected: Story = {
  args: {
    toolCall: rejectedToolCall,
  },
};
