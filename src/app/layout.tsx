import type { Metadata } from "next";
import { MswProvider } from "@/mocks/MswProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panda Energy",
  description: "CRM IA-first para comercializadoras de energía",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <MswProvider>{children}</MswProvider>
      </body>
    </html>
  );
}
