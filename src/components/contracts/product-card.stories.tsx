import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProductCard } from "./product-card";
import type { components } from "@/lib/api/types";

type ProductOut = components["schemas"]["ProductOut"];

const MOCK_PRODUCT_FIXED: ProductOut = {
  id: "66666666-6666-6666-6666-660000000001",
  tenant_id: "11111111-1111-1111-1111-111111111111",
  code: "FIX-2.0TD-12",
  name: "Tarifa Fija Hogar 2.0TD",
  energy_type: "electricity",
  tariff_kind: "fixed",
  term_months: 12,
  currency: "EUR",
  pricing: {
    energy_eur_per_kwh: 0.12,
    power_eur_per_kw_day: 0.085,
    fixed_monthly_eur: 3.5,
  },
  notes: "Tarifa fija 12 meses para residencial con 2.0TD",
  status: "active",
  created_at: "2026-04-10T08:00:00.000Z",
  updated_at: "2026-04-10T08:00:00.000Z",
};

const MOCK_PRODUCT_INDEXED: ProductOut = {
  id: "66666666-6666-6666-6666-660000000002",
  tenant_id: "11111111-1111-1111-1111-111111111111",
  code: "IDX-2.0TD-12",
  name: "Tarifa Indexada OMIE 2.0TD",
  energy_type: "electricity",
  tariff_kind: "indexed_omie",
  term_months: 12,
  currency: "EUR",
  pricing: {
    margin_eur_per_kwh: 0.005,
    power_eur_per_kw_day: 0.082,
    fixed_monthly_eur: 2.0,
  },
  notes: "Indexada al mercado OMIE con margen comercial minimo",
  status: "active",
  created_at: "2026-04-10T08:00:00.000Z",
  updated_at: "2026-04-10T08:00:00.000Z",
};

const MOCK_PRODUCT_GAS: ProductOut = {
  id: "66666666-6666-6666-6666-660000000004",
  tenant_id: "11111111-1111-1111-1111-111111111111",
  code: "GAS-RL2-12",
  name: "Gas Natural Hogar RL.2",
  energy_type: "gas",
  tariff_kind: "fixed",
  term_months: 12,
  currency: "EUR",
  pricing: {
    energy_eur_per_kwh: 0.055,
    fixed_monthly_eur: 4.0,
  },
  notes: null,
  status: "active",
  created_at: "2026-04-10T08:00:00.000Z",
  updated_at: "2026-04-10T08:00:00.000Z",
};

const meta = {
  title: "Contracts/ProductCard",
  component: ProductCard,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Tarjeta de producto para seleccion en el wizard de contratacion. Muestra nombre, tipo de tarifa, duracion, precio y notas.",
      },
    },
  },
  args: {
    product: MOCK_PRODUCT_FIXED,
    selected: false,
    onSelect: () => {},
  },
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: { selected: true },
};

export const IndexedProduct: Story = {
  name: "Producto indexado OMIE",
  args: { product: MOCK_PRODUCT_INDEXED },
};

export const GasProduct: Story = {
  name: "Producto gas",
  args: { product: MOCK_PRODUCT_GAS },
};

export const Grid: Story = {
  name: "Grid de seleccion",
  render: function GridStory() {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const products = [MOCK_PRODUCT_FIXED, MOCK_PRODUCT_INDEXED, MOCK_PRODUCT_GAS];
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            selected={selectedId === p.id}
            onSelect={() => setSelectedId(p.id)}
          />
        ))}
      </div>
    );
  },
};
