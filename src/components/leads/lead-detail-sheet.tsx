"use client";

import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * STUB temporal del Sheet de detalle de lead.
 *
 * Se completará en F-2.4 (commit posterior). Por ahora cierra → vuelve a
 * `/leads` para validar el routing.
 */
export interface LeadDetailSheetProps {
  leadId: string;
}

export function LeadDetailSheet({ leadId }: LeadDetailSheetProps) {
  const router = useRouter();
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) router.push("/leads");
      }}
    >
      <SheetContent side="right" className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Detalle de lead</SheetTitle>
          <SheetDescription>
            Vista completa en construcción (F-2.4). Lead ID:{" "}
            <code className="font-mono text-xs">{leadId}</code>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
