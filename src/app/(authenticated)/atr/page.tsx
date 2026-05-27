import { AtrPageClient } from "@/components/atr/atr-page-client";

/**
 * `/atr` — monitorización de mensajes regulatorios ATR.
 *
 * Server component shell — delegates to AtrPageClient for interactivity.
 */
export default function AtrPage() {
  return <AtrPageClient />;
}
