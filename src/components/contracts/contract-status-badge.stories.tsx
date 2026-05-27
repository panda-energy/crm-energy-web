import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ContractStatusBadge } from "./contract-status-badge";

const meta = {
  title: "Contracts/ContractStatusBadge",
  component: ContractStatusBadge,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Badge de estado de contrato con colores semánticos. Cubre los 6 estados del ciclo de vida: borrador, firmado, enviado a distribuidora, activo, rechazado, cancelado.",
      },
    },
  },
  argTypes: {
    status: {
      control: "select",
      options: [
        "draft",
        "signed",
        "sent_to_dso",
        "active",
        "rejected",
        "cancelled",
      ],
    },
  },
  args: {
    status: "draft",
  },
} satisfies Meta<typeof ContractStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllStatuses: Story = {
  name: "Todos los estados",
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <ContractStatusBadge status="draft" />
      <ContractStatusBadge status="signed" />
      <ContractStatusBadge status="sent_to_dso" />
      <ContractStatusBadge status="active" />
      <ContractStatusBadge status="rejected" />
      <ContractStatusBadge status="cancelled" />
    </div>
  ),
};

export const HappyPath: Story = {
  name: "Ciclo de vida (happy path)",
  render: () => (
    <div className="flex items-center gap-1">
      <ContractStatusBadge status="draft" />
      <span className="text-muted-foreground">→</span>
      <ContractStatusBadge status="signed" />
      <span className="text-muted-foreground">→</span>
      <ContractStatusBadge status="sent_to_dso" />
      <span className="text-muted-foreground">→</span>
      <ContractStatusBadge status="active" />
    </div>
  ),
};
