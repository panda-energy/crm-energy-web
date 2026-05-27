"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AtrMessage } from "@/lib/api/types-sprint4";

interface AtrDetailSheetProps {
  message: AtrMessage | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Stub — full implementation in F-4.3.
 */
export function AtrDetailSheet({
  message,
  open,
  onClose,
}: AtrDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            Detalle ATR{message ? ` - ${message.message_type}` : ""}
          </SheetTitle>
        </SheetHeader>
        {message && (
          <div className="mt-4 text-sm text-muted-foreground">
            <p>ID: {message.id}</p>
            <p>CUPS: {message.cups_code}</p>
            <p>Distribuidora: {message.distributor}</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
