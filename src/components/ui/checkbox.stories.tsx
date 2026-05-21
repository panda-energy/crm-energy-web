import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Checkbox } from "./checkbox";

const meta = {
  title: "UI/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Checkbox Radix con soporte para estado indeterminado. Usado en bulk selection de la tabla de leads.",
      },
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { "aria-label": "Seleccionar" },
};

export const Checked: Story = {
  args: { checked: true, "aria-label": "Seleccionar" },
};

export const Indeterminate: Story = {
  args: { checked: "indeterminate", "aria-label": "Seleccionar" },
};

export const Disabled: Story = {
  args: { disabled: true, "aria-label": "Seleccionar" },
};

export const SelectAllPattern: Story = {
  name: "Patrón seleccionar todo (real)",
  render: () => {
    function Demo() {
      const [items, setItems] = useState([
        { id: "a", name: "María García", checked: false },
        { id: "b", name: "Joan Puig", checked: false },
        { id: "c", name: "Carlos Fernández", checked: false },
      ]);
      const allChecked = items.every((i) => i.checked);
      const someChecked = items.some((i) => i.checked);
      const headerState: boolean | "indeterminate" = allChecked
        ? true
        : someChecked
          ? "indeterminate"
          : false;
      return (
        <div className="w-72 space-y-2 rounded-md border border-border bg-surface p-3">
          <div className="flex items-center gap-2 border-b border-border pb-2 text-sm font-medium">
            <Checkbox
              checked={headerState}
              onCheckedChange={(c) =>
                setItems((prev) => prev.map((i) => ({ ...i, checked: !!c })))
              }
              aria-label="Seleccionar todos"
            />
            <span>
              {items.filter((i) => i.checked).length} de {items.length}
            </span>
          </div>
          {items.map((it) => (
            <label
              key={it.id}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={it.checked}
                onCheckedChange={(c) =>
                  setItems((prev) =>
                    prev.map((i) =>
                      i.id === it.id ? { ...i, checked: !!c } : i,
                    ),
                  )
                }
                aria-label={`Seleccionar ${it.name}`}
              />
              {it.name}
            </label>
          ))}
        </div>
      );
    }
    return <Demo />;
  },
};
