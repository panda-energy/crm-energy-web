import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Label } from "./label";

const meta = {
  title: "UI/Select",
  component: Select,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Wrapper sobre Radix Select. Radix se encarga de la navegación con teclado, roles ARIA y anuncios a SR. Usa tokens (`border-input`, `bg-surface`).",
      },
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-72 space-y-2">
      <Label htmlFor="story-status">Estado del lead</Label>
      <Select>
        <SelectTrigger id="story-status">
          <SelectValue placeholder="Selecciona un estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="new">Nuevo</SelectItem>
          <SelectItem value="qualified">Cualificado</SelectItem>
          <SelectItem value="contacted">Contactado</SelectItem>
          <SelectItem value="won">Ganado</SelectItem>
          <SelectItem value="lost">Perdido</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const Grouped: Story = {
  render: () => (
    <div className="w-72 space-y-2">
      <Label htmlFor="story-source">Fuente</Label>
      <Select>
        <SelectTrigger id="story-source">
          <SelectValue placeholder="Origen del lead" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Online</SelectLabel>
            <SelectItem value="web">Web</SelectItem>
            <SelectItem value="campaña-google">Campaña Google</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Offline</SelectLabel>
            <SelectItem value="referido">Referido</SelectItem>
            <SelectItem value="comercial-campo">Comercial campo</SelectItem>
            <SelectItem value="evento">Evento</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-72 space-y-2">
      <Label htmlFor="story-disabled">Estado</Label>
      <Select disabled>
        <SelectTrigger id="story-disabled">
          <SelectValue placeholder="No disponible" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="new">Nuevo</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const WithSelectedValue: Story = {
  render: () => (
    <div className="w-72 space-y-2">
      <Label htmlFor="story-selected">Estado</Label>
      <Select defaultValue="qualified">
        <SelectTrigger id="story-selected">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="new">Nuevo</SelectItem>
          <SelectItem value="qualified">Cualificado</SelectItem>
          <SelectItem value="contacted">Contactado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};
