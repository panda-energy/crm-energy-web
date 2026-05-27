import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChatBubble } from "./chat-bubble";
import { MarkdownContent } from "./markdown-content";

const meta = {
  title: "AI Chat/ChatBubble",
  component: ChatBubble,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Burbuja de mensaje individual del AI Chat. Usuario (derecha, brand), asistente (izquierda, muted), sistema (centrado, sutil).",
      },
    },
  },
} satisfies Meta<typeof ChatBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UserMessage: Story = {
  args: {
    role: "user",
    timestamp: "2026-05-25T08:01:00.000Z",
    children: "Cuantos leads nuevos tenemos esta semana?",
  },
};

export const AssistantMessage: Story = {
  args: {
    role: "assistant",
    timestamp: "2026-05-25T08:01:05.000Z",
    children: (
      <MarkdownContent
        content={
          "Esta semana habeis recibido **12 leads nuevos**. De ellos:\n\n- 5 vienen de formulario web\n- 4 de WhatsApp\n- 3 de referidos"
        }
      />
    ),
  },
};

export const SystemMessage: Story = {
  args: {
    role: "system",
    children:
      "Soy Panda AI, tu asistente del CRM. Puedo ayudarte a gestionar leads, contratos y mas.",
  },
};
