"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import type { AtrMessage } from "@/lib/api/types-sprint4";
import { useRetryAtrMessage, useAtrMessageXml } from "@/lib/api/hooks/use-atr";
import { AtrStatusBadge } from "./atr-status-badge";
import { AtrMessageTypeBadge } from "./atr-message-type-badge";
import { AtrStatusTimeline } from "./atr-status-timeline";
import { AtrDetailInfo } from "./atr-detail-info";
import { XmlViewer } from "./xml-viewer";

interface AtrDetailSheetProps {
  message: AtrMessage | null;
  open: boolean;
  onClose: () => void;
}

export function AtrDetailSheet({
  message,
  open,
  onClose,
}: AtrDetailSheetProps) {
  const retryMutation = useRetryAtrMessage();
  const canRetry =
    message?.status === "rejected" || message?.status === "timeout";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle className="text-base">
              Detalle ATR
            </SheetTitle>
            {message && (
              <>
                <AtrMessageTypeBadge type={message.message_type} short />
                <AtrStatusBadge status={message.status} />
              </>
            )}
          </div>
        </SheetHeader>

        {message && (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto pt-2">
            {/* Timeline */}
            <AtrStatusTimeline message={message} />

            {/* Retry button */}
            {canRetry && (
              <Button
                variant="outline"
                size="sm"
                className="w-fit gap-2"
                onClick={() => retryMutation.mutate(message.id)}
                disabled={retryMutation.isPending}
              >
                <RefreshCw
                  className={`size-4 ${retryMutation.isPending ? "animate-spin" : ""}`}
                  aria-hidden
                />
                {retryMutation.isPending ? "Reintentando..." : "Reintentar envio"}
              </Button>
            )}

            {/* Tabs: Info / XML */}
            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="xml">XML</TabsTrigger>
              </TabsList>

              <TabsContent value="info">
                <AtrDetailInfo message={message} />
              </TabsContent>

              <TabsContent value="xml">
                <XmlViewerTab messageId={message.id} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Lazy XML loader inside the tab. */
function XmlViewerTab({ messageId }: { messageId: string }) {
  const { data, isLoading, isError } = useAtrMessageXml(messageId);

  if (isLoading) {
    return (
      <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
        Cargando XML...
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
        No se pudo cargar el XML del mensaje.
      </div>
    );
  }
  return <XmlViewer xml={data} filename={`atr-${messageId.slice(0, 8)}.xml`} />;
}
