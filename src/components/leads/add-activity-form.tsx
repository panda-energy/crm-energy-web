"use client";

import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/ui/toast";
import { useCreateLeadActivity } from "@/lib/api/hooks/use-leads";

/**
 * Mini-form para añadir una actividad manual (`note` / `call` / `email`).
 *
 * El backend rechaza tipos de sistema en este endpoint (stage_changed,
 * whatsapp_*, etc.) — los crea él internamente. Por eso el Select sólo
 * expone tres opciones manuales.
 *
 * Para la pestaña "Notas" se puede pasar `lockedType="note"` y se oculta
 * el selector.
 */
export interface AddActivityFormProps {
  leadId: string;
  /** Si se fija, oculta el selector de tipo y usa éste. */
  lockedType?: "note" | "call" | "email";
  /** Placeholder del textarea. Cambia según el contexto. */
  placeholder?: string;
}

type ManualActivityType = "note" | "call" | "email";

const TYPE_LABELS: Record<ManualActivityType, string> = {
  note: "Nota",
  call: "Llamada",
  email: "Email",
};

export function AddActivityForm({
  leadId,
  lockedType,
  placeholder,
}: AddActivityFormProps) {
  const [type, setType] = useState<ManualActivityType>(lockedType ?? "note");
  const [body, setBody] = useState("");
  const mutation = useCreateLeadActivity(leadId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    try {
      await mutation.mutateAsync({
        type,
        // reason: el backend acepta `summary` (texto libre) y `payload`
        // (extras). Para notas manuales colocamos todo en `summary`.
        summary: trimmed.slice(0, 500),
        payload: trimmed.length > 500 ? { body: trimmed } : {},
      });
      setBody("");
      toast.success(
        type === "note"
          ? "Nota guardada"
          : `${TYPE_LABELS[type]} registrada`,
      );
    } catch (err) {
      toast.error("No pudimos guardar la actividad", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-2 rounded-md border border-border bg-surface/40 p-3"
    >
      {!lockedType ? (
        <div className="flex items-center gap-2">
          <Label htmlFor="activity-type" className="text-xs text-muted-foreground">
            Tipo
          </Label>
          <Select
            value={type}
            onValueChange={(v) => setType(v as ManualActivityType)}
          >
            <SelectTrigger id="activity-type" className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="note">Nota</SelectItem>
              <SelectItem value="call">Llamada</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={
          placeholder ??
          (type === "note"
            ? "Escribe una nota interna…"
            : "Resumen de la interacción…")
        }
        rows={3}
        aria-label="Contenido de la actividad"
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={mutation.isPending || !body.trim()}>
          {mutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Plus className="size-3.5" aria-hidden />
          )}
          Añadir
        </Button>
      </div>
    </form>
  );
}
