"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * STUB temporal del Sheet de creación de lead.
 *
 * Se completará en F-2.10 (siguiente commit). Por ahora solo abre/cierra
 * para validar el wiring desde la página `/leads`.
 */
export interface CreateLeadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPipelineId: string | undefined;
}

export function CreateLeadSheet({
  open,
  onOpenChange,
  defaultPipelineId: _defaultPipelineId,
}: CreateLeadSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Crear lead</SheetTitle>
          <SheetDescription>
            Formulario en construcción — llega en el siguiente commit (F-2.10).
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
