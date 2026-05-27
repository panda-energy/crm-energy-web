"use client";

import { Download, FileText, PenLine, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useContract,
  useGeneratePdf,
  getContractPdfUrl,
} from "@/lib/api/hooks/use-contracts";
import { toast } from "@/lib/ui/toast";
import { ContractStatusBadge } from "./contract-status-badge";

/**
 * Contract detail sheet with tabs: Info / PDF / Firma / Timeline (F-3.6).
 */
interface ContractDetailSheetProps {
  contractId: string;
  onClose: () => void;
  onSign: (contractId: string) => void;
  onInPersonSign?: (contractId: string) => void;
}

export function ContractDetailSheet({
  contractId,
  onClose,
  onSign,
  onInPersonSign,
}: ContractDetailSheetProps) {
  const contractQuery = useContract(contractId);
  const generatePdf = useGeneratePdf(contractId);
  const contract = contractQuery.data;

  const handleGeneratePdf = async () => {
    try {
      await generatePdf.mutateAsync(undefined);
      toast.success("PDF generado correctamente");
    } catch (err) {
      toast.error("Error al generar PDF", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="size-5" aria-hidden />
            {contract ? (
              <span className="font-mono">{contract.number}</span>
            ) : (
              <Skeleton className="h-5 w-40" />
            )}
          </SheetTitle>
        </SheetHeader>

        {contractQuery.isLoading ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : contractQuery.isError ? (
          <div className="p-4 text-center">
            <p className="text-sm text-destructive">Error al cargar contrato</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => contractQuery.refetch()}>
              Reintentar
            </Button>
          </div>
        ) : contract ? (
          <Tabs defaultValue="info" className="p-4">
            <TabsList className="w-full">
              <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
              <TabsTrigger value="pdf" className="flex-1">PDF</TabsTrigger>
              <TabsTrigger value="firma" className="flex-1">Firma</TabsTrigger>
              <TabsTrigger value="timeline" className="flex-1">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <ContractStatusBadge status={contract.status} />
              </div>
              <InfoField label="Cliente" value={contract.customer_name} />
              <InfoField label="NIF/CIF" value={contract.customer_tax_id} />
              <InfoField label="Email" value={contract.customer_email} />
              <InfoField label="Teléfono" value={contract.customer_phone_e164} />
              <InfoField label="Dir. facturación" value={contract.billing_address} />
              <InfoField label="Duración" value={`${contract.term_months} meses`} />
              <InfoField label="Fecha inicio" value={contract.start_date} />
              <InfoField
                label="Creado"
                value={new Date(contract.created_at).toLocaleDateString("es-ES")}
              />
            </TabsContent>

            <TabsContent value="pdf" className="mt-4 space-y-4">
              {contract.pdf_storage_key ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    PDF generado el{" "}
                    {contract.pdf_generated_at
                      ? new Date(contract.pdf_generated_at).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "fecha desconocida"}
                  </p>
                  <Button asChild>
                    <a
                      href={getContractPdfUrl(contract.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="mr-1.5 size-4" aria-hidden />
                      Descargar PDF
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGeneratePdf}
                    disabled={generatePdf.isPending}
                  >
                    <RefreshCw className="mr-1.5 size-4" aria-hidden />
                    Regenerar PDF
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No se ha generado un PDF todavía.
                  </p>
                  <Button
                    onClick={handleGeneratePdf}
                    disabled={generatePdf.isPending}
                  >
                    <FileText className="mr-1.5 size-4" aria-hidden />
                    Generar PDF
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="firma" className="mt-4 space-y-4">
              {contract.signed_at ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Contrato firmado
                  </p>
                  <InfoField
                    label="Firmado el"
                    value={new Date(contract.signed_at).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  />
                  <InfoField label="Proveedor" value={contract.signature_provider} />
                </div>
              ) : contract.signature_requested_at ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    Firma solicitada, pendiente de respuesta
                  </p>
                  <InfoField
                    label="Solicitada el"
                    value={new Date(contract.signature_requested_at).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  />
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {contract.pdf_storage_key
                      ? "El contrato tiene PDF. Puedes enviarlo a firma."
                      : "Genera el PDF primero para poder enviarlo a firma."}
                  </p>
                  {contract.pdf_storage_key && contract.status === "draft" && (
                    <div className="flex flex-col gap-2">
                      <Button onClick={() => onSign(contract.id)}>
                        <Send className="mr-1.5 size-4" aria-hidden />
                        Enviar a firma (remoto)
                      </Button>
                      {onInPersonSign && (
                        <Button
                          variant="outline"
                          onClick={() => onInPersonSign(contract.id)}
                        >
                          <PenLine className="mr-1.5 size-4" aria-hidden />
                          Firma presencial
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <div className="space-y-3 text-sm">
                <TimelineEntry
                  label="Creado"
                  date={contract.created_at}
                />
                {contract.pdf_generated_at && (
                  <TimelineEntry
                    label="PDF generado"
                    date={contract.pdf_generated_at}
                  />
                )}
                {contract.signature_requested_at && (
                  <TimelineEntry
                    label="Firma solicitada"
                    date={contract.signature_requested_at}
                  />
                )}
                {contract.signed_at && (
                  <TimelineEntry
                    label="Firmado"
                    date={contract.signed_at}
                  />
                )}
                {contract.sent_to_dso_at && (
                  <TimelineEntry
                    label="Enviado a distribuidora"
                    date={contract.sent_to_dso_at}
                  />
                )}
                {contract.activated_at && (
                  <TimelineEntry
                    label="Activado"
                    date={contract.activated_at}
                  />
                )}
                {contract.cancelled_at && (
                  <TimelineEntry
                    label="Cancelado"
                    date={contract.cancelled_at}
                  />
                )}
                {contract.rejected_at && (
                  <TimelineEntry
                    label="Rechazado"
                    date={contract.rejected_at}
                    detail={contract.rejection_reason}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">
        {value ?? <span className="text-muted-foreground">-</span>}
      </span>
    </div>
  );
}

function TimelineEntry({
  label,
  date,
  detail,
}: {
  label: string;
  date: string;
  detail?: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(date).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        {detail && (
          <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
        )}
      </div>
    </div>
  );
}
