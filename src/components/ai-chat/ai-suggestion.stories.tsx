import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AiSuggestion } from "./ai-suggestion";

const meta = {
  title: "AI Chat/AiSuggestion",
  component: AiSuggestion,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Badge/chip reutilizable de sugerencia IA inline. Aparece junto a campos de formulario con valor sugerido y explicacion.",
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
} satisfies Meta<typeof AiSuggestion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    suggestion: "5.75 kW",
    explanation:
      "Potencia optima recomendada basado en consumo SIPS",
    onApply: () => undefined,
  },
};

export const Warning: Story = {
  args: {
    suggestion: "",
    explanation: "Este CUPS ya tiene un contrato activo con competencia",
    isWarning: true,
  },
};

export const Applied: Story = {
  render: () => (
    <AiSuggestion
      suggestion="Tarifa Fija Hogar 2.0TD"
      explanation="Mejor relacion calidad-precio para este perfil"
      onApply={() => undefined}
    />
  ),
};
