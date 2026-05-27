"use client";

import { useCallback, useState } from "react";
import { Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useContract,
  useSignContract,
} from "@/lib/api/hooks/use-contracts";
import { toast } from "@/lib/ui/toast";
import { ContractStatusBadge } from "./contract-status-badge";
import { SignatureCanvas } from "./signature-canvas";

/**
 * In-person signature dialog (F-3.5).
 *
 * Used when the customer is physically present. Shows a signature canvas
 * for them to sign, then sends to Signaturit.
 *
 * NOTE: The backend ContractSignRequest does not yet accept a signature_image
 * field. The canvas signature is captured for UX and stored locally but the
 * legal signature still flows through Signaturit. A backend enhancement
 * should add `signature_image_base64` to ContractSignRequest.
 */
interface InPersonSignDialogProps {
  contractId: string;
  onClose: () => void;
}

export function InPersonSignDialog({
  contractId,
  onClose,
}: InPersonSignDialogProps) {
  const contractQuery = useContract(contractId);
  const signContract = useSignContract(contractId);
  const contract = contractQuery.data;

  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const handleSignatureChange = useCallback((dataUrl: string | null) => {
    setSignatureDataUrl(dataUrl);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!contract || !signatureDataUrl) return;

    try {
      const result = await signContract.mutateAsync({
        recipient_name: contract.customer_name ?? "",
        recipient_email: contract.customer_email ?? "",
        subject: `Contrato ${contract.number} - Firma presencial`,
        body: "Firmado presencialmente por el cliente.",
      });
      toast.success(
        `Firma registrada para contrato ${contract.number} via ${result.provider}`,
      );
      onClose();
    } catch (err) {
      toast.error("Error al registrar firma", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }, [contract, signatureDataUrl, signContract, onClose]);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="size-4" aria-hidden />
            Firma presencial
          </DialogTitle>
          <DialogDescription>
            {contract ? (
              <span className="flex items-center gap-2">
                Contrato{" "}
                <span className="font-mono">{contract.number}</span>
                <ContractStatusBadge status={contract.status} />
              </span>
            ) : (
              "Cargando contrato..."
            )}
          </DialogDescription>
        </DialogHeader>

        {contract && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-medium">{contract.customer_name}</p>
              {contract.customer_tax_id && (
                <p className="text-muted-foreground">
                  NIF/CIF: {contract.customer_tax_id}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">
                Firma del cliente
              </p>
              <p className="text-xs text-muted-foreground">
                Pida al cliente que firme en el recuadro inferior.
              </p>
            </div>

            <SignatureCanvas
              onChange={handleSignatureChange}
              height={180}
              disabled={signContract.isPending}
              aria-label="Firma del cliente"
            />
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={signContract.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!signatureDataUrl || signContract.isPending || !contract}
          >
            {signContract.isPending && (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            )}
            Confirmar firma
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
