"use client";

import {
  CheckCircle2,
  Tag,
  TagsIcon,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBulkLeads, useRestoreLead } from "@/lib/api/hooks/use-leads";
import { useClerkApiContext } from "@/lib/api/hooks/clerk-context";
import { apiPost } from "@/lib/api/client";
import { useLeadsUiStore } from "@/lib/leads/leads-ui-store";
import { countSelectedNotVisible } from "@/lib/leads/bulk-selection";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_ORDER,
} from "@/lib/leads/format";
import { toast } from "@/lib/ui/toast";
import { cn } from "@/lib/utils/cn";
import { TagsInput } from "./tags-input";
import { UserPicker } from "./user-picker";
import type { Lead } from "@/lib/api/hooks/use-leads";

/**
 * Barra flotante de bulk actions (F-2.6, cleanup wave).
 *
 * Se monta dentro de `LeadsPageClient` y aparece cuando hay al menos un
 * lead seleccionado. Acciones:
 *  - **Asignar propietario**: abre un `<UserPicker>` con búsqueda paginada
 *    contra `/v1/users`. Sustituye al input UUID plano de Sprint 2 inicial.
 *  - **Cambiar estado**: select de los 5 status.
 *  - **Añadir / Quitar etiquetas**: TagsInput.
 *  - **Eliminar**: bulk soft-delete vía `POST /v1/leads/bulk` con
 *    `action: 'delete'` (un solo round-trip). Confirm con texto específico
 *    exigido por BACKLOG. Toast con "Deshacer" 6s que llama a
 *    `POST /v1/leads/{id}/restore` por cada ID (idempotente).
 *
 * Indicador "{M} no visibles con los filtros actuales" cuando hay IDs
 * seleccionados que no aparecen en la página visible (preserva selección
 * cross-filter).
 */
const UNDO_DURATION_MS = 6000;

export interface BulkActionBarProps {
  /** IDs visibles en la página actual — usado para el indicador cross-filter. */
  visibleLeadIds: ReadonlyArray<string>;
}

export function BulkActionBar({ visibleLeadIds }: BulkActionBarProps) {
  const selectedIds = useLeadsUiStore((s) => s.selectedIds);
  const clearSelection = useLeadsUiStore((s) => s.clearSelection);

  const ids = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const notVisible = useMemo(
    () => countSelectedNotVisible(selectedIds, visibleLeadIds),
    [selectedIds, visibleLeadIds],
  );

  const bulkMutation = useBulkLeads();
  const { getToken, tenantId } = useClerkApiContext();

  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Foco automático en el primer botón cuando la barra aparece — patrón
  // a11y recomendado para no perder al usuario en el flujo de selección.
  const barRef = useFocusOnAppear<HTMLDivElement>(ids.length > 0);

  if (ids.length === 0) return null;

  const handleAssignOwner = async (ownerId: string) => {
    setAssignOpen(false);
    try {
      await bulkMutation.mutateAsync({
        ids,
        action: "update",
        assign_owner_id: ownerId,
      });
      toast.success(`${ids.length} leads asignados`);
    } catch (err) {
      toast.error("No se pudo asignar propietario", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const handleSetStatus = async (status: Lead["status"]) => {
    try {
      await bulkMutation.mutateAsync({
        ids,
        action: "update",
        set_status: status,
      });
      toast.success(
        `${ids.length} leads marcados como ${LEAD_STATUS_LABELS[status]}`,
      );
    } catch (err) {
      toast.error("No se pudo cambiar el estado", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const handleTagsChange = async (tags: string[], mode: "add" | "remove") => {
    if (tags.length === 0) return;
    try {
      await bulkMutation.mutateAsync(
        mode === "add"
          ? { ids, action: "update", add_tags: tags }
          : { ids, action: "update", remove_tags: tags },
      );
      toast.success(
        mode === "add"
          ? `Etiquetas añadidas a ${ids.length} leads`
          : `Etiquetas quitadas de ${ids.length} leads`,
      );
    } catch (err) {
      toast.error("No se pudieron actualizar las etiquetas", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const handleDelete = async () => {
    setDeleteConfirmOpen(false);
    try {
      // Cleanup wave: un solo round-trip con `action: 'delete'`.
      const result = await bulkMutation.mutateAsync({
        ids,
        action: "delete",
      });
      const deleted = result.ids;
      if (deleted.length === 0) {
        toast.error("No se pudo eliminar ningún lead");
        return;
      }
      clearSelection();
      toast.action(`${deleted.length} leads eliminados`, {
        actionLabel: "Deshacer",
        duration: UNDO_DURATION_MS,
        onAction: () => {
          void restoreBatch(deleted, getToken, tenantId);
        },
      });
    } catch (err) {
      toast.error("No se pudieron eliminar los leads", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  return (
    <>
      <div
        ref={barRef}
        role="region"
        aria-label="Acciones para leads seleccionados"
        className={cn(
          "fixed inset-x-0 bottom-4 z-40 mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3",
          "rounded-lg border border-border bg-surface px-4 py-3 shadow-4",
          "data-[state=open]:animate-[var(--animate-slide-in-bottom)]",
        )}
        data-state="open"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSelection}
            aria-label="Limpiar selección"
            className="size-8"
          >
            <X className="size-4" aria-hidden />
          </Button>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {ids.length}{" "}
              {ids.length === 1 ? "lead seleccionado" : "leads seleccionados"}
            </span>
            {notVisible > 0 ? (
              <span className="text-[11px] text-muted-foreground">
                {notVisible} no {notVisible === 1 ? "visible" : "visibles"} con
                los filtros actuales
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Asignar propietario — UserPicker con búsqueda */}
          <Popover open={assignOpen} onOpenChange={setAssignOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={bulkMutation.isPending}
              >
                <UserCog className="size-3.5" aria-hidden />
                Asignar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <UserPicker
                onSelect={(user) => void handleAssignOwner(user.id)}
                placeholder="Buscar propietario…"
                emptyText="Ningún usuario coincide."
              />
            </PopoverContent>
          </Popover>

          {/* Cambiar estado */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={bulkMutation.isPending}
              >
                <CheckCircle2 className="size-3.5" aria-hidden />
                Estado
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 space-y-2">
              <p className="text-xs font-medium">Cambiar estado</p>
              <Select onValueChange={(v) => handleSetStatus(v as Lead["status"])}>
                <SelectTrigger className="h-9 text-sm" aria-label="Nuevo estado">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {LEAD_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PopoverContent>
          </Popover>

          {/* Añadir etiquetas */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={bulkMutation.isPending}
              >
                <Tag className="size-3.5" aria-hidden />
                + Etiquetas
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 space-y-2">
              <p className="text-xs font-medium">Añadir etiquetas</p>
              <TagsInputForm onSubmit={(tags) => handleTagsChange(tags, "add")} />
            </PopoverContent>
          </Popover>

          {/* Quitar etiquetas */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={bulkMutation.isPending}
              >
                <TagsIcon className="size-3.5" aria-hidden />
                − Etiquetas
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 space-y-2">
              <p className="text-xs font-medium">Quitar etiquetas</p>
              <TagsInputForm
                placeholder="Etiquetas a quitar"
                onSubmit={(tags) => handleTagsChange(tags, "remove")}
              />
            </PopoverContent>
          </Popover>

          {/* Eliminar */}
          <Button
            variant="destructive"
            size="sm"
            disabled={bulkMutation.isPending}
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 className="size-3.5" aria-hidden />
            Eliminar
          </Button>
        </div>
      </div>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar leads</DialogTitle>
            <DialogDescription>
              Eliminar <strong>{ids.length}</strong>{" "}
              {ids.length === 1 ? "lead" : "leads"}. Se pueden recuperar
              individualmente desde el toast de notificación durante 6 segundos.
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
              disabled={bulkMutation.isPending}
            >
              {bulkMutation.isPending ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Llama a `/v1/leads/{id}/restore` para cada ID. El endpoint es idempotente
 * y MUY barato; para un bulk-undo de ~50 IDs el lag es imperceptible. Si
 * cualquiera falla, mostramos un toast warning con el conteo de éxitos.
 *
 * reason: el backend no expone un endpoint de restore masivo (decisión
 * deliberada: el caso de uso del bulk-undo es raro y los individual
 * restores son idempotentes; añadir bulk-restore introduciría más
 * superficie de API sin ganancia clara).
 */
async function restoreBatch(
  leadIds: string[],
  getToken: ReturnType<typeof useClerkApiContext>["getToken"],
  tenantId: string | null,
) {
  const results = await Promise.allSettled(
    leadIds.map((id) =>
      apiPost<void>(
        "/v1/leads/{lead_id}/restore",
        undefined,
        {
          getToken,
          tenantId,
          pathParams: { lead_id: id },
          idempotencyKey: crypto.randomUUID(),
        },
      ),
    ),
  );
  const ok = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - ok;
  if (failed === 0) {
    toast.success(`${ok} leads restaurados`);
  } else if (ok === 0) {
    toast.error(`No se pudo restaurar ningún lead (${failed} fallos)`);
  } else {
    toast.warning(`${ok} restaurados, ${failed} fallaron`);
  }
}

// reason: `useRestoreLead` no se usa directamente arriba porque queremos
// disparar N restores en paralelo dentro del callback del toast, lo que
// requiere un client function (no un hook). Re-exportamos para tests si
// hace falta.
void useRestoreLead;

// ── Sub-forms (pequeños, viven aquí para no crear archivos huérfanos) ──────

function TagsInputForm({
  placeholder,
  onSubmit,
}: {
  placeholder?: string;
  onSubmit: (tags: string[]) => void | Promise<void>;
}) {
  const [tags, setTags] = useState<string[]>([]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit(tags);
        setTags([]);
      }}
      className="space-y-2"
    >
      <TagsInput
        value={tags}
        onChange={setTags}
        placeholder={placeholder ?? "Añade etiquetas + Enter"}
      />
      <Button
        type="submit"
        size="sm"
        className="w-full"
        disabled={tags.length === 0}
      >
        Aplicar a {tags.length} {tags.length === 1 ? "etiqueta" : "etiquetas"}
      </Button>
    </form>
  );
}

// ── Hooks helpers ───────────────────────────────────────────────────────────

function useFocusOnAppear<T extends HTMLElement>(condition: boolean) {
  const [ref, setRef] = useState<T | null>(null);
  useEffect(() => {
    if (!condition || !ref) return;
    // Busca el primer botón dentro del contenedor y le da foco.
    const focusable = ref.querySelector<HTMLElement>(
      "button:not([disabled])",
    );
    focusable?.focus({ preventScroll: true });
  }, [condition, ref]);
  // reason: callback ref para que el useEffect dispare cuando el nodo
  // aparezca/cambie en el árbol.
  return setRef;
}
