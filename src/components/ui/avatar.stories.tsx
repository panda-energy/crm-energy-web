import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

const meta = {
  title: "UI/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Wrapper sobre Radix Avatar. Radix gestiona el fallback automáticamente cuando la imagen tarda o falla. El consumidor decide tamaño con `className` (default `size-10`).",
      },
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage
        src="https://i.pravatar.cc/120?img=1"
        alt="María García"
      />
      <AvatarFallback>MG</AvatarFallback>
    </Avatar>
  ),
};

export const FallbackInitials: Story = {
  name: "Fallback (sin imagen)",
  render: () => (
    <Avatar>
      <AvatarFallback>CG</AvatarFallback>
    </Avatar>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar className="size-8">
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
      <Avatar className="size-12">
        <AvatarFallback>LG</AvatarFallback>
      </Avatar>
      <Avatar className="size-16">
        <AvatarFallback>XL</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const BrokenImage: Story = {
  name: "Imagen rota → fallback",
  render: () => (
    <Avatar>
      <AvatarImage src="https://no-existe.example.com/x.jpg" alt="" />
      <AvatarFallback>RT</AvatarFallback>
    </Avatar>
  ),
};
