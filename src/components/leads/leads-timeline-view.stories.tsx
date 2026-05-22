import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { Lead } from "@/lib/api/hooks/use-leads";
import { leadsFixture } from "@/mocks/fixtures/leads";

import { LeadsTimelineView } from "./leads-timeline-view";

/**
 * Stories de `LeadsTimelineView` (F-2.3).
 *
 * Cubre los 4 estados obligatorios del DoD:
 *   - default (datos reales del fixture)
 *   - loading (skeleton)
 *   - empty global (sin leads + sin filtros)
 *   - empty filtros (sin leads + filtros activos)
 *
 * Plus: una story con leads diseñados para forzar los badges de
 * estancamiento (>14 días sin contacto + >30 días en `new`).
 *
 * `now` está fijado para que las fechas relativas sean estables en
 * Chromatic / visual regression.
 */
const FIXED_NOW = new Date("2026-05-22T12:00:00Z");

const meta = {
  title: "Leads/LeadsTimelineView",
  component: LeadsTimelineView,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Vista timeline vertical reverso de leads, agrupada por mes en `es`. Click → navega a `/leads/[id]`. Badges de estancamiento: rojo `Sin contacto X días` (>14d desde last_contacted_at), naranja `Estancado` (>30d en `new`/`contacted`).",
      },
    },
  },
  args: {
    data: leadsFixture as Lead[],
    hasActiveFilters: false,
    isLoading: false,
    onCreateLead: () => {
      // noop en Storybook
    },
    onClearFilters: () => {
      // noop en Storybook
    },
    now: FIXED_NOW,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 720 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LeadsTimelineView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default — leads del fixture",
};

export const Loading: Story = {
  name: "Cargando (skeleton)",
  args: {
    isLoading: true,
    data: [],
  },
};

export const EmptyGlobal: Story = {
  name: "Sin leads (global)",
  args: {
    data: [],
    hasActiveFilters: false,
  },
};

export const EmptyFiltered: Story = {
  name: "Sin resultados (filtros activos)",
  args: {
    data: [],
    hasActiveFilters: true,
  },
};

/**
 * Datos artificiales: tres leads con badges de estancamiento diferentes
 * para QA visual (rojo `Sin contacto X días` y naranja `Estancado`).
 */
const STAGNATION_LEADS: Lead[] = [
  {
    ...leadsFixture[0]!,
    id: "stagnant-1",
    first_name: "Mateu",
    last_name: "Estancado",
    company: "Inmobiliaria Olvidada SL",
    status: "new",
    created_at: "2026-03-01T10:00:00Z",
    updated_at: "2026-03-15T10:00:00Z",
    last_contacted_at: null,
    tags: ["estancado"],
  },
  {
    ...leadsFixture[0]!,
    id: "stale-contact-1",
    first_name: "Núria",
    last_name: "Sense Contacte",
    company: "Distribuidora Pause SA",
    status: "qualified",
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-03T10:00:00Z",
    last_contacted_at: "2026-05-03T10:00:00Z",
    tags: ["b2b", "renovables"],
  },
  {
    ...leadsFixture[0]!,
    id: "healthy-1",
    first_name: "Pol",
    last_name: "Saludable",
    company: "Comercializadora Pulso SL",
    status: "contacted",
    created_at: "2026-05-15T10:00:00Z",
    updated_at: "2026-05-20T10:00:00Z",
    last_contacted_at: "2026-05-20T10:00:00Z",
    tags: ["pyme"],
  },
];

export const Stagnation: Story = {
  name: "Badges de estancamiento (visual)",
  args: {
    data: STAGNATION_LEADS,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Datos diseñados para forzar los tres estados: `Estancado` (naranja), `Sin contacto X días` (rojo) y sano (sin badge extra).",
      },
    },
  },
};
