import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Info } from "lucide-react";
import { Button } from "./button";
import { KbdShortcut } from "./kbd-shortcut";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <TooltipProvider delayDuration={200} skipDelayDuration={0}>
        <Story />
      </TooltipProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Tooltip Radix. Caso real: indicadores en columnas no-sortables de la tabla de leads y shortcuts en triggers globales (cmd-k).",
      },
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover</Button>
      </TooltipTrigger>
      <TooltipContent>Texto del tooltip</TooltipContent>
    </Tooltip>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Más info"
          className="text-muted-foreground hover:text-foreground"
        >
          <Info className="size-4" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        Esta columna solo es ordenable por created/updated/status.
      </TooltipContent>
    </Tooltip>
  ),
};

export const WithShortcut: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="sm">
          Buscar…
        </Button>
      </TooltipTrigger>
      <TooltipContent className="flex items-center gap-2">
        Abrir command palette
        <KbdShortcut keys={["mod", "k"]} ariaHidden={false} />
      </TooltipContent>
    </Tooltip>
  ),
};
