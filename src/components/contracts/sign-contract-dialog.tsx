"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useContract,
  useSignContract,
} from "@/lib/api/hooks/use-contracts";
import {
  ContractSignRequestSchema,
  type ContractSignRequest,
} from "@/lib/api/zod-schemas";
import { toast } from "@/lib/ui/toast";
import { ContractStatusBadge } from "./contract-status-badge";

/**
 * Dialog for sending a contract to signature via Signaturit (F-3.5).
 *
 * Pre-fills recipient from contract customer data.
 * Shows contract status badge for context.
 */
interface SignContractDialogProps {
  contractId: string;
  onClose: () => void;
}

export function SignContractDialog({
  contractId,
  onClose,
}: SignContractDialogProps) {
  const contractQuery = useContract(contractId);
  const signContract = useSignContract(contractId);
  const contract = contractQuery.data;

  const form = useForm<ContractSignRequest>({
    resolver: zodResolver(ContractSignRequestSchema),
    defaultValues: {
      recipient_name: contract?.customer_name ?? "",
      recipient_email: contract?.customer_email ?? "",
      subject: contract ? `Contrato ${contract.number} - Panda Energy` : "",
      body: null,
    },
  });

  // Update defaults when contract loads
  if (contract && !form.formState.isDirty) {
    const vals = form.getValues();
    if (!vals.recipient_name && contract.customer_name) {
      form.setValue("recipient_name", contract.customer_name);
    }
    if (!vals.recipient_email && contract.customer_email) {
      form.setValue("recipient_email", contract.customer_email);
    }
    if (!vals.subject) {
      form.setValue("subject", `Contrato ${contract.number} - Panda Energy`);
    }
  }

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const result = await signContract.mutateAsync(data);
      toast.success(
        `Firma enviada a ${data.recipient_email} via ${result.provider}`,
      );
      onClose();
    } catch (err) {
      toast.error("Error al enviar a firma", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  });

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="size-4" aria-hidden />
            Enviar a firma
          </DialogTitle>
          <DialogDescription>
            {contract && (
              <span className="flex items-center gap-2">
                Contrato{" "}
                <span className="font-mono">{contract.number}</span>
                <ContractStatusBadge status={contract.status} />
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sign-name">Nombre del firmante *</Label>
            <Input
              id="sign-name"
              {...form.register("recipient_name")}
              aria-invalid={Boolean(form.formState.errors.recipient_name)}
            />
            {form.formState.errors.recipient_name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.recipient_name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sign-email">Email del firmante *</Label>
            <Input
              id="sign-email"
              type="email"
              {...form.register("recipient_email")}
              aria-invalid={Boolean(form.formState.errors.recipient_email)}
            />
            {form.formState.errors.recipient_email && (
              <p className="text-xs text-destructive">
                {form.formState.errors.recipient_email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sign-subject">Asunto</Label>
            <Input id="sign-subject" {...form.register("subject")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sign-body">Mensaje (opcional)</Label>
            <Textarea
              id="sign-body"
              placeholder="Mensaje adicional para el firmante..."
              {...form.register("body")}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={signContract.isPending}>
              {signContract.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              )}
              Enviar a firma
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
