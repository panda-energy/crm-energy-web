"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MessageCircle, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailPanelSkeleton } from "@/components/skeletons/detail-panel-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/lib/ui/toast";
import {
  useLead,
  useLeadActivities,
  type Lead,
} from "@/lib/api/hooks/use-leads";
import {
  useOptimisticDeleteLead,
  useOptimisticUpdateLead,
} from "@/lib/api/hooks/use-leads-optimistic";
import { usePipelineStages, usePipelines } from "@/lib/api/hooks/use-pipelines";
import {
  composeInitials,
  composeLeadName,
  formatMoney,
  formatPhone,
  LEAD_SOURCE_LABELS,
  LEAD_SOURCE_ORDER,
} from "@/lib/leads/format";
import { formatAbsoluteTime } from "@/lib/leads/relative-time";
import { AddActivityForm } from "./add-activity-form";
import { InlineEditField } from "./inline-edit-field";
import { LeadActivitiesList } from "./lead-activities-list";
import { LeadStatusBadge } from "./lead-status-badge";
import { TagsInput } from "./tags-input";

/**
 * Sheet de detalle de Lead con tabs Info / Actividades / Notas (F-2.4).
 *
 * Routing:
 *  - Vive en `/leads/[leadId]`. Al cerrar preservamos los `searchParams`
 *    activos para que el usuario no pierda filtros, paginación ni sort
 *    aplicados antes de abrir el detalle (Wave 2 — F-2.6 dejó la base
 *    de selección persistente; cerrar y reabrir el detalle no debe
 *    "limpiar" filtros).
 *
 * Patrones:
 *  - InlineEditField → useUpdateLead.mutateAsync con sólo el campo
 *    modificado (PATCH parcial). El cliente revierte solo en error
 *    gracias al try/catch del InlineEditField.
 *  - Eliminar pide confirmación con el texto específico exigido por
 *    BACKLOG ("Eliminar lead {nombre}. ..."). Por defecto el undo de 6s
 *    está deshabilitado con tooltip explicativo — el backend aún no
 *    expone restore (deuda).
 *  - WhatsApp button está visible pero deshabilitado (UI llega en
 *    Sprint 4).
 */
export interface LeadDetailSheetProps {
  leadId: string;
}

export function LeadDetailSheet({ leadId }: LeadDetailSheetProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadQuery = useLead(leadId);
  const lead = leadQuery.data;

  const closeSheet = useCallback(() => {
    // reason: preservamos los searchParams (filtros/orden/paginación) que
    // venían activos en /leads cuando se abrió el detalle. `router.push`
    // sin querystring perdería el contexto de la lista.
    const qs = searchParams.toString();
    router.push(qs ? `/leads?${qs}` : "/leads");
  }, [router, searchParams]);

  return (
    <Sheet
      open
      onOpenChange={(next) => {
        if (!next) closeSheet();
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>
            {lead ? composeLeadName(lead) : "Detalle de lead"}
          </SheetTitle>
        </SheetHeader>

        {leadQuery.isLoading ? (
          <div className="p-6">
            <DetailPanelSkeleton />
          </div>
        ) : leadQuery.isError || !lead ? (
          <div className="p-6">
            <EmptyState
              title="Lead no encontrado"
              description={
                leadQuery.error?.message ??
                "Es posible que se haya eliminado o que aún no se haya sincronizado."
              }
              action={
                <Button onClick={closeSheet} variant="outline">
                  Volver a la lista
                </Button>
              }
            />
          </div>
        ) : (
          <LeadDetailBody lead={lead} onClose={closeSheet} />
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Cuerpo del Sheet con `lead` ya garantizado. Separado para legibilidad. */
function LeadDetailBody({
  lead,
  onClose,
}: {
  lead: Lead;
  onClose: () => void;
}) {
  const updateLead = useOptimisticUpdateLead(lead.id);
  const deleteLead = useOptimisticDeleteLead(lead.id);

  const pipelinesQuery = usePipelines();
  const stagesQuery = usePipelineStages(lead.pipeline_id);

  const stagesById = useMemo(() => {
    const m = new Map<
      string,
      import("@/lib/api/hooks/use-pipelines").PipelineStage
    >();
    for (const s of stagesQuery.data ?? []) m.set(s.id, s);
    return m;
  }, [stagesQuery.data]);

  const activitiesQuery = useLeadActivities(lead.id);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  /**
   * Helper: PATCH parcial con optimistic + undo 6s en mutaciones
   * reversibles. El optimistic ya rollback-ea en error (lo hace el hook).
   * Aquí decidimos QUÉ mutaciones llevan undo (status/owner/tags/source).
   */
  const patchField = async (
    patch: Parameters<typeof updateLead.mutateAsync>[0]["patch"],
    options: { undoMessage?: string } = {},
  ) => {
    try {
      await updateLead.mutateAsync({ patch, undoMessage: options.undoMessage });
    } catch (err) {
      // Re-lanzar para que InlineEditField revierta + muestre error inline.
      throw err instanceof Error ? err : new Error("Error al guardar");
    }
  };

  const handleDelete = async () => {
    setDeleteConfirmOpen(false);
    try {
      await deleteLead.mutateAsync({
        // reason: el backend ya expone POST /v1/leads/{id}/restore (idempotente).
        // El hook ofrece un toast con "Deshacer" 6s que llama al endpoint y
        // restaura tanto la BD como las cachés frontend.
        undoMessage: `Lead eliminado: ${composeLeadName(lead)}`,
      });
      onClose();
    } catch (err) {
      toast.error("No se pudo eliminar", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  return (
    <>
      <header className="flex items-start gap-3 border-b border-border px-6 py-4">
        <Avatar className="size-12 shrink-0">
          <AvatarFallback className="text-base">
            {composeInitials(lead)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-foreground">
            {composeLeadName(lead)}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <LeadStatusBadge status={lead.status} />
            {lead.company ? (
              <span className="text-xs text-muted-foreground">
                {lead.company}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled
            title="Disponible en Sprint 4 — backend listo, falta UI"
          >
            <MessageCircle className="size-4" aria-hidden />
            WhatsApp
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteConfirmOpen(true)}
            aria-label="Eliminar lead"
            className="text-danger hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </header>

      <Tabs defaultValue="info" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="border-b border-border px-6">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="actividades">Actividades</TabsTrigger>
          <TabsTrigger value="notas">Notas</TabsTrigger>
        </TabsList>

        <TabsContent
          value="info"
          className="mt-0 flex-1 overflow-y-auto px-6 py-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InlineEditField
              label="Nombre"
              value={lead.first_name}
              onSubmit={(v) => patchField({ first_name: v || null })}
            />
            <InlineEditField
              label="Apellidos"
              value={lead.last_name}
              onSubmit={(v) => patchField({ last_name: v || null })}
            />
            <InlineEditField
              label="Email"
              value={lead.email}
              type="email"
              onSubmit={(v) => patchField({ email: v || null })}
            />
            <InlineEditField
              label="Teléfono"
              value={lead.phone_e164}
              displayValue={formatPhone(lead.phone_e164) || "—"}
              type="tel"
              onSubmit={(v) => {
                // reason: empty string en phone → backend lo trata como reset
                // a null (deuda backend documentada). Para UI mandamos string
                // tal cual.
                return patchField({ phone: v });
              }}
            />
            <InlineEditField
              label="Empresa"
              value={lead.company}
              onSubmit={(v) => patchField({ company: v || null })}
              className="sm:col-span-2"
            />
            <InlineEditField
              label="CUPS"
              value={lead.cups}
              onSubmit={(v) => patchField({ cups: v || null })}
              className="sm:col-span-2"
            />
            <InlineEditField
              label="Origen"
              value={lead.source}
              displayValue={LEAD_SOURCE_LABELS[lead.source]}
              onSubmit={(v) =>
                patchField(
                  { source: v as Lead["source"] },
                  { undoMessage: "Origen actualizado" },
                )
              }
              renderEditor={({ value, setValue, submit, cancel }) => (
                <Select
                  defaultOpen
                  value={value}
                  onValueChange={(v) => {
                    setValue(v);
                    // Cerramos la edición tras seleccionar para confirmar.
                    setTimeout(() => submit(), 0);
                  }}
                >
                  <SelectTrigger
                    className="h-8 text-sm"
                    onBlur={cancel}
                    aria-label="Origen del lead"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCE_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>
                        {LEAD_SOURCE_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <InlineEditField
              label="Pipeline"
              value={lead.pipeline_id}
              displayValue={
                pipelinesQuery.data?.find((p) => p.id === lead.pipeline_id)
                  ?.name ?? lead.pipeline_id.slice(0, 8)
              }
              readOnly
              // reason: cambiar pipeline implicaría mover stage_id también
              // (transición compleja); F-2.2 Kanban lo cubre. Aquí solo lectura.
              onSubmit={() => Promise.resolve()}
            />
            <InlineEditField
              label="Etapa"
              value={lead.stage_id}
              displayValue={
                stagesById.get(lead.stage_id)?.name ??
                lead.stage_id.slice(0, 8)
              }
              readOnly
              // reason: mover de etapa usa el endpoint dedicado /move (F-2.2).
              // Aquí solo informativo.
              onSubmit={() => Promise.resolve()}
            />
            <InlineEditField
              label="Propietario"
              value={lead.owner_id}
              displayValue={
                lead.owner_id ? (
                  <span className="font-mono text-xs">
                    {lead.owner_id.slice(0, 8)}…
                  </span>
                ) : (
                  <span className="italic">Sin asignar</span>
                )
              }
              onSubmit={(v) =>
                patchField(
                  { owner_id: v.trim() || null },
                  { undoMessage: "Propietario actualizado" },
                )
              }
            />
            <InlineEditField
              label="Valor estimado"
              value={
                lead.estimated_value_cents !== null
                  ? String(lead.estimated_value_cents / 100)
                  : ""
              }
              displayValue={formatMoney(
                lead.estimated_value_cents,
                lead.currency,
              )}
              type="number"
              onSubmit={(v) => {
                if (v === "") {
                  return patchField({ estimated_value_cents: null });
                }
                const n = Number(v);
                if (!Number.isFinite(n) || n < 0) {
                  throw new Error("Importe inválido.");
                }
                return patchField({
                  estimated_value_cents: Math.round(n * 100),
                });
              }}
            />
            <InlineEditField
              label="Referencia origen"
              value={lead.source_ref}
              onSubmit={(v) => patchField({ source_ref: v || null })}
              className="sm:col-span-2"
            />
            <div className="sm:col-span-2">
              <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                Etiquetas
              </p>
              <TagsInput
                value={lead.tags}
                onChange={(next) => {
                  void patchField(
                    { tags: next },
                    { undoMessage: "Etiquetas actualizadas" },
                  ).catch(() => {
                    /* error toast lo maneja el hook optimistic. */
                  });
                }}
                ariaLabel="Etiquetas del lead"
              />
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <div>
              <dt className="font-medium">Último contacto</dt>
              <dd>{formatAbsoluteTime(lead.last_contacted_at)}</dd>
            </div>
            <div>
              <dt className="font-medium">Creado</dt>
              <dd>{formatAbsoluteTime(lead.created_at)}</dd>
            </div>
            <div>
              <dt className="font-medium">Actualizado</dt>
              <dd>{formatAbsoluteTime(lead.updated_at)}</dd>
            </div>
          </dl>

          {Object.keys(lead.custom_fields).length > 0 ? (
            <details className="mt-4 rounded-md border border-border bg-surface/30 px-3 py-2 text-xs">
              <summary className="cursor-pointer font-medium text-foreground">
                Campos personalizados ({Object.keys(lead.custom_fields).length})
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-muted-foreground">
                {JSON.stringify(lead.custom_fields, null, 2)}
              </pre>
            </details>
          ) : null}
        </TabsContent>

        <TabsContent
          value="actividades"
          className="mt-0 flex-1 overflow-y-auto px-6 py-4"
        >
          <div className="space-y-4">
            <AddActivityForm leadId={lead.id} />
            <LeadActivitiesList
              activities={activitiesQuery.data}
              stagesById={stagesById}
              loading={activitiesQuery.isLoading}
            />
          </div>
        </TabsContent>

        <TabsContent
          value="notas"
          className="mt-0 flex-1 overflow-y-auto px-6 py-4"
        >
          <div className="space-y-4">
            <AddActivityForm
              leadId={lead.id}
              lockedType="note"
              placeholder="Escribe una nota interna sobre este lead…"
            />
            <LeadActivitiesList
              activities={activitiesQuery.data}
              stagesById={stagesById}
              filterType="note"
              loading={activitiesQuery.isLoading}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirmación de eliminar — texto específico exigido por BACKLOG. */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar lead</DialogTitle>
            <DialogDescription>
              Eliminar lead <strong>{composeLeadName(lead)}</strong>. Se puede
              recuperar desde el toast de notificación durante 6 segundos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLead.isPending}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
