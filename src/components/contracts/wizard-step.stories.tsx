import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WizardSteps } from "./wizard-step";

const WIZARD_STEPS = [
  { title: "Lead", description: "Seleccionar cliente" },
  { title: "CUPS", description: "Punto de suministro" },
  { title: "Producto", description: "Tarifa y simulación" },
  { title: "Revisar", description: "Confirmar y crear" },
];

const meta = {
  title: "Contracts/WizardSteps",
  component: WizardSteps,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Indicador de pasos del wizard de contratación. Muestra progreso con números, checks y barras de conexión.",
      },
    },
  },
  args: {
    steps: WIZARD_STEPS,
    currentStep: 0,
  },
} satisfies Meta<typeof WizardSteps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Step1: Story = {
  name: "Paso 1 — Lead",
  args: { currentStep: 0 },
};

export const Step2: Story = {
  name: "Paso 2 — CUPS",
  args: { currentStep: 1 },
};

export const Step3: Story = {
  name: "Paso 3 — Producto",
  args: { currentStep: 2 },
};

export const Step4: Story = {
  name: "Paso 4 — Revisar",
  args: { currentStep: 3 },
};

export const Completed: Story = {
  name: "Todos completados",
  args: { currentStep: 4 },
};

export const TwoSteps: Story = {
  name: "Wizard corto (2 pasos)",
  args: {
    steps: [
      { title: "Datos", description: "Información básica" },
      { title: "Confirmar" },
    ],
    currentStep: 1,
  },
};
