import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BarChart3, Plus, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "./button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./command";

const meta = {
  title: "UI/Command Palette",
  component: CommandDialog,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Command palette basado en cmdk. Caso real: cmd-k global del CRM (búsqueda de leads, acciones rápidas, navegación).",
      },
    },
  },
} satisfies Meta<typeof CommandDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    children: null,
  },
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Abrir palette</Button>
          <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Buscar leads, ejecutar acciones…" />
            <CommandList>
              <CommandEmpty>Sin resultados.</CommandEmpty>
              <CommandGroup heading="Acciones rápidas">
                <CommandItem>
                  <Plus className="size-4" aria-hidden /> Crear lead
                </CommandItem>
                <CommandItem>
                  <Users className="size-4" aria-hidden /> Ir a Leads
                </CommandItem>
                <CommandItem>
                  <BarChart3 className="size-4" aria-hidden /> Ir a Pipeline
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Leads (búsqueda)">
                <CommandItem>María García</CommandItem>
                <CommandItem>Joan Puig</CommandItem>
                <CommandItem>Carlos Fernández</CommandItem>
              </CommandGroup>
            </CommandList>
          </CommandDialog>
        </>
      );
    }
    return <Demo />;
  },
};
