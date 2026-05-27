import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QuoteSummary } from "./quote-summary";

const meta = {
  title: "Contracts/QuoteSummary",
  component: QuoteSummary,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Resumen visual de simulacion de ahorro. Muestra factura actual vs proyectada con barras comparativas, porcentaje y supuestos.",
      },
    },
  },
} satisfies Meta<typeof QuoteSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithSavings: Story = {
  name: "Con ahorro (~18%)",
  args: {
    quote: {
      baseline_eur: "1200.00",
      projected_eur: "984.00",
      savings_eur: "216.00",
      savings_pct: "18.0",
      assumptions: [
        "Consumo anual estimado: 3.500 kWh",
        "Potencia contratada: 4.6 kW",
        "Precios OMIE promedio 12 meses",
      ],
    },
  },
};

export const HighSavings: Story = {
  name: "Ahorro alto (~35%)",
  args: {
    quote: {
      baseline_eur: "2400.00",
      projected_eur: "1560.00",
      savings_eur: "840.00",
      savings_pct: "35.0",
      assumptions: [
        "Consumo industrial: 50.000 kWh/anio",
        "Tarifa 3.0TD multi-periodo",
      ],
    },
  },
};

export const MinimalSavings: Story = {
  name: "Ahorro minimo (~3%)",
  args: {
    quote: {
      baseline_eur: "800.00",
      projected_eur: "776.00",
      savings_eur: "24.00",
      savings_pct: "3.0",
      assumptions: ["Gas natural RL.2", "Consumo estimado: 8.000 kWh/anio"],
    },
  },
};

export const NoAssumptions: Story = {
  name: "Sin supuestos",
  args: {
    quote: {
      baseline_eur: "1000.00",
      projected_eur: "850.00",
      savings_eur: "150.00",
      savings_pct: "15.0",
      assumptions: [],
    },
  },
};

export const Loading: Story = {
  name: "Cargando",
  args: {
    quote: null,
    isLoading: true,
  },
};

export const ErrorState: Story = {
  name: "Error",
  args: {
    quote: null,
    error: new Error("No se pudo conectar con el servidor de cálculo"),
  },
};

export const Empty: Story = {
  name: "Sin datos",
  args: {
    quote: null,
  },
};
