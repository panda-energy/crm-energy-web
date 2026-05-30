import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kuro Energy — CRM con IA para comercializadoras de energia",
  description:
    "Automatiza ATR, captura leads por WhatsApp, firma contratos digitalmente y gestiona tu cartera desde una unica plataforma inteligente. Disenado para el sector energetico.",
  openGraph: {
    title: "Kuro Energy — CRM con IA para comercializadoras de energia",
    description:
      "Automatiza ATR, captura leads por WhatsApp, firma contratos digitalmente. Disenado para el sector energetico.",
    url: "https://kuro.energy",
    siteName: "Kuro Energy",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kuro Energy — CRM con IA para comercializadoras",
    description:
      "Automatiza ATR, captura leads por WhatsApp, firma contratos digitalmente.",
  },
  metadataBase: new URL("https://kuro.energy"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
