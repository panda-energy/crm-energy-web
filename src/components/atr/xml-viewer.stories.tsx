import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { XmlViewer } from "./xml-viewer";

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<MensajeATR xmlns="http://www.cnmc.es/atr/3.1">
  <Cabecera>
    <CodigoDelProceso>C1</CodigoDelProceso>
    <CodigoDelPaso>01</CodigoDelPaso>
    <CUPS>ES0021000011223344AA</CUPS>
  </Cabecera>
  <DatosGenerales>
    <Distribuidor>e-distribucion</Distribuidor>
    <Comercializador>R2-0025</Comercializador>
  </DatosGenerales>
  <Cliente>
    <TipoIdentificacion>NIF</TipoIdentificacion>
    <Identificacion>12345678A</Identificacion>
    <NombreCliente>Maria Garcia Lopez</NombreCliente>
  </Cliente>
  <Contrato>
    <TarifaAcceso>2.0TD</TarifaAcceso>
    <PotenciasContratadas>
      <Potencia Periodo="1">5.750</Potencia>
      <Potencia Periodo="2">5.750</Potencia>
    </PotenciasContratadas>
  </Contrato>
</MensajeATR>`;

const CORRECTED_XML = `<?xml version="1.0" encoding="UTF-8"?>
<MensajeATR xmlns="http://www.cnmc.es/atr/3.1">
  <Cabecera>
    <CodigoDelProceso>C1</CodigoDelProceso>
    <CodigoDelPaso>01</CodigoDelPaso>
    <CUPS>ES0021000011223344AA</CUPS>
  </Cabecera>
  <DatosGenerales>
    <Distribuidor>e-distribucion</Distribuidor>
    <Comercializador>R2-0025</Comercializador>
  </DatosGenerales>
  <Cliente>
    <TipoIdentificacion>NIF</TipoIdentificacion>
    <Identificacion>12345678Z</Identificacion>
    <NombreCliente>Maria Garcia Lopez Martinez</NombreCliente>
  </Cliente>
  <Contrato>
    <TarifaAcceso>2.0TD</TarifaAcceso>
    <PotenciasContratadas>
      <Potencia Periodo="1">4.600</Potencia>
      <Potencia Periodo="2">4.600</Potencia>
    </PotenciasContratadas>
  </Contrato>
</MensajeATR>`;

const meta: Meta<typeof XmlViewer> = {
  title: "Sprint 4/XmlViewer",
  component: XmlViewer,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-2xl p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof XmlViewer>;

export const Default: Story = {
  args: {
    xml: SAMPLE_XML,
    filename: "atr-c1-001.xml",
  },
};

export const SideBySideDiff: Story = {
  args: {
    xml: SAMPLE_XML,
    xmlCompare: CORRECTED_XML,
    filename: "atr-c1-001.xml",
  },
};

export const ShortXml: Story = {
  args: {
    xml: `<?xml version="1.0"?>\n<Response><Status>OK</Status></Response>`,
  },
};
