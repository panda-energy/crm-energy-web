import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Input estándar con tokens (`border-input`, `bg-background`). Soporta el patrón `aria-invalid=\"true\"` para mostrar el borde de error sin clases extra.",
      },
    },
  },
  args: {
    placeholder: "Escribe aquí…",
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-80 space-y-2">
      <Label htmlFor="story-default">Nombre</Label>
      <Input id="story-default" {...args} />
    </div>
  ),
};

export const WithValue: Story = {
  render: (args) => (
    <div className="w-80 space-y-2">
      <Label htmlFor="story-value">Email</Label>
      <Input
        id="story-value"
        type="email"
        defaultValue="maria.garcia@ejemplo.com"
        {...args}
      />
    </div>
  ),
};

export const Error: Story = {
  name: "Error (aria-invalid)",
  render: (args) => (
    <div className="w-80 space-y-2">
      <Label htmlFor="story-err">Email</Label>
      <Input
        id="story-err"
        aria-invalid="true"
        aria-describedby="story-err-msg"
        defaultValue="no-es-email"
        {...args}
      />
      <p id="story-err-msg" className="text-xs text-danger">
        Introduce un email válido.
      </p>
    </div>
  ),
};

export const Disabled: Story = {
  render: (args) => (
    <div className="w-80 space-y-2">
      <Label htmlFor="story-dis">Teléfono</Label>
      <Input id="story-dis" disabled defaultValue="+34 612 000 000" {...args} />
    </div>
  ),
};

export const Password: Story = {
  render: (args) => (
    <div className="w-80 space-y-2">
      <Label htmlFor="story-pwd">Contraseña</Label>
      <Input id="story-pwd" type="password" {...args} />
    </div>
  ),
};

export const File: Story = {
  render: (args) => (
    <div className="w-80 space-y-2">
      <Label htmlFor="story-file">Factura</Label>
      <Input id="story-file" type="file" {...args} />
    </div>
  ),
};
