"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/lib/ui/toast";
import {
  leadsQueryKeys,
  useCreateLead,
  type Lead,
  type LeadPage,
} from "@/lib/api/hooks/use-leads";
import { usePipelines, usePipelineStages } from "@/lib/api/hooks/use-pipelines";
import {
  CreateLeadFormSchema,
  defaultCreateLeadFormValues,
  extractFieldErrors,
  formToLeadCreate,
  type CreateLeadFormValues,
} from "@/lib/leads/create-lead-form";
import {
  LEAD_SOURCE_LABELS,
  LEAD_SOURCE_ORDER,
} from "@/lib/leads/format";
import { TagsInput } from "./tags-input";
import { AiSuggestion } from "@/components/ai-chat/ai-suggestion";

/**
 * Sheet lateral para crear un Lead (F-2.10).
 *
 * Stack:
 *  - react-hook-form + zodResolver (CreateLeadFormSchema).
 *  - useCreateLead (TanStack Query, idempotencyKey 'auto').
 *  - Optimistic update sobre la primera página visible de useLeads.
 *
 * UX:
 *  - Validación inline (mensajes debajo del campo, no toast).
 *  - Auto-save draft en sessionStorage; restaura al reabrir si no se canceló
 *    explícitamente.
 *  - Botón "Cancelar" pide confirmación si hay cambios sin guardar.
 *  - Submit OK: toast success "Lead creado" con acción "Ver".
 *  - Submit error: mapeo de errores por campo si el Problem RFC 7807 los
 *    provee; fallback a toast error con title/detail.
 *
 * Pipeline / stage:
 *  - Si solo hay 1 pipeline, ocultamos el select y pasamos su id silencioso.
 *  - El stage por defecto es el primero de la pipeline cargada.
 *  - Cuando cambia el pipeline, se actualiza el stage al primero del nuevo.
 */
export interface CreateLeadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPipelineId: string | undefined;
}

const DRAFT_KEY = "lead-create-draft";

export function CreateLeadSheet({
  open,
  onOpenChange,
  defaultPipelineId,
}: CreateLeadSheetProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createLead = useCreateLead();

  const pipelinesQuery = usePipelines();
  const pipelines = pipelinesQuery.data ?? [];
  const onlyOnePipeline = pipelines.length === 1;

  const form = useForm<CreateLeadFormValues>({
    resolver: zodResolver(CreateLeadFormSchema),
    defaultValues: defaultCreateLeadFormValues,
    mode: "onBlur",
  });

  const pipelineId = form.watch("pipeline_id");
  const stagesQuery = usePipelineStages(pipelineId || undefined);
  // reason: useMemo para estabilizar la identidad de `stages` y evitar
  // re-ejecutar efectos que la observan en cada render.
  const stages = useMemo(() => stagesQuery.data ?? [], [stagesQuery.data]);

  // reason: discardConfirm es un Dialog secundario; lo controlamos aparte
  // del Sheet para que esté siempre montado mientras éste lo esté.
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  // Track si el draft ya se hidrató (evitamos sobrescribir con defaults al
  // primer render).
  const hydratedRef = useRef(false);

  // ── Auto-restore draft al abrir ──────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CreateLeadFormValues>;
        form.reset({ ...defaultCreateLeadFormValues, ...parsed });
      } else {
        form.reset(defaultCreateLeadFormValues);
      }
    } catch {
      form.reset(defaultCreateLeadFormValues);
    }
    hydratedRef.current = true;
  }, [open, form]);

  // ── Set default pipeline/stage cuando carguen ────────────────────────────
  useEffect(() => {
    if (!open || !hydratedRef.current) return;
    const current = form.getValues();
    if (!current.pipeline_id && defaultPipelineId) {
      form.setValue("pipeline_id", defaultPipelineId, { shouldDirty: false });
    }
  }, [open, defaultPipelineId, form]);

  useEffect(() => {
    if (!open || !hydratedRef.current) return;
    const currentStage = form.getValues("stage_id");
    if (!currentStage && stages.length > 0) {
      form.setValue("stage_id", stages[0]!.id, { shouldDirty: false });
    }
    // Si el stage actual no pertenece a la pipeline elegida, lo reseteamos.
    if (currentStage && stages.length > 0) {
      const stillExists = stages.some((s) => s.id === currentStage);
      if (!stillExists) {
        form.setValue("stage_id", stages[0]!.id, { shouldDirty: false });
      }
    }
  }, [open, stages, form]);

  // ── Auto-save draft mientras el usuario escribe ──────────────────────────
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;
    const subscription = form.watch((values) => {
      try {
        window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
      } catch {
        // Storage lleno o privado — ignoramos silenciosamente.
      }
    });
    return () => subscription.unsubscribe();
  }, [open, form]);

  const clearDraft = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(DRAFT_KEY);
    }
  };

  // ── Cancel / close handling ──────────────────────────────────────────────
  const tryClose = () => {
    if (form.formState.isDirty) {
      setDiscardConfirmOpen(true);
    } else {
      onOpenChange(false);
    }
  };

  const confirmDiscard = () => {
    setDiscardConfirmOpen(false);
    clearDraft();
    form.reset(defaultCreateLeadFormValues);
    onOpenChange(false);
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const onSubmit = form.handleSubmit(async (values) => {
    const body = formToLeadCreate(values);
    try {
      const created = await createLead.mutateAsync(body);
      // Optimistic prepend: insertamos al inicio de la primera página de la
      // cache. TanStack invalida después, pero esto da la sensación inmediata.
      queryClient.setQueriesData<LeadPage>(
        { queryKey: leadsQueryKeys.all },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: [created as Lead, ...old.items.filter((l) => l.id !== created.id)],
            total: old.total + 1,
          };
        },
      );
      clearDraft();
      form.reset(defaultCreateLeadFormValues);
      toast.success("Lead creado", {
        description: "Aparece al inicio de tu lista.",
      });
      // reason: añadimos un toast con CTA "Ver" manualmente porque la API
      // de toast.action está reservada para undo (6s) — para "Ver" usamos
      // un info breve y dejamos que el user navegue.
      toast.action("Abrir detalle del lead", {
        actionLabel: "Ver",
        duration: 6000,
        onAction: () => router.push(`/leads/${created.id}`),
      });
      onOpenChange(false);
    } catch (err) {
      const { fieldErrors, general } = extractFieldErrors(err);
      let mapped = 0;
      for (const [path, message] of Object.entries(fieldErrors)) {
        // Mapear paths del backend a campos del form (best-effort).
        const knownPaths = [
          "first_name",
          "last_name",
          "email",
          "phone",
          "company",
          "source",
          "pipeline_id",
          "stage_id",
          "tags",
          "currency",
          "source_ref",
        ] as const;
        const target = knownPaths.find((k) => path === k);
        if (target) {
          form.setError(target, { type: "server", message });
          mapped += 1;
        }
      }
      if (mapped === 0) {
        toast.error("No pudimos crear el lead", {
          description: general ?? "Reintenta en unos segundos.",
        });
      }
    }
  });

  // ── Render ───────────────────────────────────────────────────────────────
  const isSubmitting = createLead.isPending || form.formState.isSubmitting;
  const errors = form.formState.errors;

  // El error general (refine) se asocia a first_name pero queremos mostrarlo
  // como banner del form.
  const rootMessage = useMemo(() => {
    const issues = Object.entries(errors).filter(
      ([, e]) => e?.type === "custom" || e?.message?.includes("al menos un"),
    );
    return issues[0]?.[1]?.message;
  }, [errors]);

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (!next) tryClose();
          else onOpenChange(true);
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 sm:max-w-md"
          // reason: con un formulario tenemos demasiado contenido para el
          // padding por defecto del Sheet. Eliminamos el grid gap y
          // gestionamos espacios internamente.
        >
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle>Crear lead</SheetTitle>
            <SheetDescription>
              Solo necesitas un nombre, apellido, empresa o email. El resto
              puedes completarlo más tarde.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={onSubmit}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 space-y-4 overflow-y-auto py-4">
              {rootMessage ? (
                <div
                  role="alert"
                  className="rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger"
                >
                  {rootMessage}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Nombre"
                  htmlFor="first_name"
                  error={errors.first_name?.message}
                >
                  <Input
                    id="first_name"
                    {...form.register("first_name")}
                    aria-invalid={Boolean(errors.first_name)}
                  />
                </FormField>
                <FormField
                  label="Apellidos"
                  htmlFor="last_name"
                  error={errors.last_name?.message}
                >
                  <Input
                    id="last_name"
                    {...form.register("last_name")}
                    aria-invalid={Boolean(errors.last_name)}
                  />
                </FormField>
              </div>

              <FormField
                label="Empresa"
                htmlFor="company"
                error={errors.company?.message}
              >
                <Input
                  id="company"
                  {...form.register("company")}
                  aria-invalid={Boolean(errors.company)}
                />
              </FormField>

              <FormField
                label="Email"
                htmlFor="email"
                error={errors.email?.message}
              >
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  aria-invalid={Boolean(errors.email)}
                  placeholder="cliente@ejemplo.com"
                />
              </FormField>

              {/* AI warning suggestion -- contextual */}
              <AiSuggestion
                suggestion=""
                explanation="Este CUPS ya tiene un contrato activo con competencia"
                isWarning
              />

              <FormField
                label="Teléfono"
                htmlFor="phone"
                error={errors.phone?.message}
                hint="Formato internacional E.164 (ej. +34612345678)."
              >
                <Input
                  id="phone"
                  type="tel"
                  {...form.register("phone")}
                  aria-invalid={Boolean(errors.phone)}
                  placeholder="+34 6XX XXX XXX"
                />
              </FormField>

              <FormField
                label="Origen"
                htmlFor="source"
                error={errors.source?.message}
              >
                <Controller
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="source">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_SOURCE_ORDER.map((src) => (
                          <SelectItem key={src} value={src}>
                            {LEAD_SOURCE_LABELS[src]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              {!onlyOnePipeline ? (
                <FormField
                  label="Pipeline"
                  htmlFor="pipeline_id"
                  error={errors.pipeline_id?.message}
                >
                  <Controller
                    control={form.control}
                    name="pipeline_id"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          // Cuando cambia la pipeline, vaciamos el stage para
                          // que el efecto-default lo restablezca.
                          form.setValue("stage_id", "", { shouldDirty: false });
                        }}
                      >
                        <SelectTrigger id="pipeline_id">
                          <SelectValue placeholder="Selecciona pipeline" />
                        </SelectTrigger>
                        <SelectContent>
                          {pipelines.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
              ) : null}

              <FormField
                label="Etapa"
                htmlFor="stage_id"
                error={errors.stage_id?.message}
              >
                <Controller
                  control={form.control}
                  name="stage_id"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={stages.length === 0}
                    >
                      <SelectTrigger id="stage_id">
                        <SelectValue
                          placeholder={
                            stagesQuery.isLoading
                              ? "Cargando…"
                              : "Selecciona etapa"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {stages.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField
                label="Etiquetas"
                htmlFor="tags"
                error={errors.tags?.message as string | undefined}
                hint="Pulsa Enter o coma para añadir. Max. 32 etiquetas."
              >
                <Controller
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <TagsInput
                      id="tags"
                      value={field.value}
                      onChange={field.onChange}
                      ariaLabel="Etiquetas del lead"
                    />
                  )}
                />
              </FormField>

              <div className="grid grid-cols-[1fr_120px] gap-3">
                <FormField
                  label="Valor estimado"
                  htmlFor="estimated_value_euros"
                  error={errors.estimated_value_euros?.message}
                  hint="Importe anual estimado en euros."
                >
                  <Input
                    id="estimated_value_euros"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    {...form.register("estimated_value_euros")}
                    aria-invalid={Boolean(errors.estimated_value_euros)}
                  />
                </FormField>
                <FormField
                  label="Moneda"
                  htmlFor="currency"
                  error={errors.currency?.message}
                >
                  <Input
                    id="currency"
                    {...form.register("currency")}
                    aria-invalid={Boolean(errors.currency)}
                    maxLength={3}
                    className="uppercase"
                  />
                </FormField>
              </div>

              <FormField
                label="Referencia origen"
                htmlFor="source_ref"
                error={errors.source_ref?.message}
                hint="ID externo, campaña, feria, etc. Opcional."
              >
                <Input
                  id="source_ref"
                  {...form.register("source_ref")}
                  aria-invalid={Boolean(errors.source_ref)}
                />
              </FormField>
            </div>

            <SheetFooter className="border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={tryClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                Crear lead
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Confirmación de descartar cambios */}
      <Dialog
        open={discardConfirmOpen}
        onOpenChange={setDiscardConfirmOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descartar cambios</DialogTitle>
            <DialogDescription>
              Has empezado a rellenar el lead. Si cierras ahora, perderás los
              datos introducidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDiscardConfirmOpen(false)}
            >
              Seguir editando
            </Button>
            <Button variant="destructive" onClick={confirmDiscard}>
              Descartar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Sub-componente local para uniformar label + control + error inline. */
function FormField({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <div aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}>
        {children}
      </div>
      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
