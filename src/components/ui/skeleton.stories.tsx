import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Skeleton } from "./skeleton";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { CardSkeleton } from "@/components/skeletons/card-skeleton";
import { DetailPanelSkeleton } from "@/components/skeletons/detail-panel-skeleton";

const meta = {
  title: "UI/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Bloque placeholder con shimmer. Regla del DoD: `skeletons, no spinners` en contenedores grandes. Los componentes específicos (`TableSkeleton`, `CardSkeleton`, `DetailPanelSkeleton`) ya incluyen `role=\"status\"` + `aria-busy` para SR.",
      },
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primitive: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  ),
};

export const Table: Story = {
  name: "TableSkeleton",
  render: () => (
    <div className="w-[640px]">
      <TableSkeleton rows={5} cols={4} />
    </div>
  ),
};

export const TableSmall: Story = {
  name: "TableSkeleton (rows=3, cols=2)",
  render: () => (
    <div className="w-[480px]">
      <TableSkeleton rows={3} cols={2} />
    </div>
  ),
};

export const Cards: Story = {
  name: "CardSkeleton (count=3)",
  render: () => (
    <div className="w-[640px]">
      <CardSkeleton count={3} />
    </div>
  ),
};

export const DetailPanel: Story = {
  name: "DetailPanelSkeleton",
  render: () => (
    <div className="w-[420px]">
      <DetailPanelSkeleton />
    </div>
  ),
};
