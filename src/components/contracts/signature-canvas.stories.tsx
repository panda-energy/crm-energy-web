import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SignatureCanvas } from "./signature-canvas";

const meta = {
  title: "Contracts/SignatureCanvas",
  component: SignatureCanvas,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Lienzo de firma digital basado en signature_pad. Soporta raton, touch y stylus. Incluye controles de deshacer, rehacer y borrar. Emite base64 PNG via onChange.",
      },
    },
  },
  args: {
    height: 200,
    disabled: false,
    penColor: "#000",
  },
  argTypes: {
    penColor: { control: "color" },
    height: { control: { type: "range", min: 100, max: 400, step: 20 } },
  },
} satisfies Meta<typeof SignatureCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TallCanvas: Story = {
  name: "Canvas alto (300px)",
  args: { height: 300 },
};

export const CustomColor: Story = {
  name: "Color personalizado (azul)",
  args: { penColor: "#2563eb" },
};

export const Disabled: Story = {
  name: "Deshabilitado",
  args: { disabled: true },
};

export const WithCallback: Story = {
  name: "Con callback onChange",
  render: function WithCallbackStory() {
    const [dataUrl, setDataUrl] = useState<string | null>(null);
    return (
      <div className="space-y-4">
        <SignatureCanvas onChange={setDataUrl} />
        <div className="rounded border border-border p-3">
          <p className="text-xs text-muted-foreground">
            {dataUrl
              ? `Firma capturada (${Math.round(dataUrl.length / 1024)} KB base64)`
              : "Firme en el lienzo para ver el output"}
          </p>
          {dataUrl && (
            <img
              src={dataUrl}
              alt="Preview de firma"
              className="mt-2 h-16 rounded border border-border bg-white object-contain"
            />
          )}
        </div>
      </div>
    );
  },
};
