"use client";

import { Pencil, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

/**
 * Campo de detalle editable inline (F-2.4 — pestaña Info).
 *
 * Comportamiento:
 *  - Modo lectura: muestra el valor (o "—" si vacío) + lápiz en hover/focus.
 *  - Click en el lápiz o en el valor → modo edición.
 *  - Enter o blur dispara `onSubmit(newValue)`. Si el callback rechaza
 *    (throw / promise reject), revertimos al valor original y mostramos
 *    error inline.
 *  - Escape cancela sin guardar.
 *
 * No incluye debounce ni optimistic — eso vive en el caller (a través de
 * useUpdateLead). El componente es agnóstico al backend.
 *
 * Para campos no-string (Select, dropdown), se usa la slot `renderEditor`.
 */
export interface InlineEditFieldProps {
  label: string;
  value: string | null | undefined;
  /** Texto a mostrar en modo lectura. Si no se pasa, usa `value` o "—". */
  displayValue?: ReactNode;
  /** Llamado cuando el user confirma; debe ser idempotente. */
  onSubmit: (next: string) => Promise<void> | void;
  /** Renderer custom para modo edición (Select, Textarea…). */
  renderEditor?: (props: {
    value: string;
    setValue: (v: string) => void;
    submit: () => void;
    cancel: () => void;
  }) => ReactNode;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "number";
  /** Si true, el field es solo lectura (los timestamps por ejemplo). */
  readOnly?: boolean;
  className?: string;
}

export function InlineEditField({
  label,
  value,
  displayValue,
  onSubmit,
  renderEditor,
  placeholder,
  type = "text",
  readOnly,
  className,
}: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(value ?? "");
      setError(null);
    }
  }, [value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select?.();
    }
  }, [editing]);

  const cancel = () => {
    setEditing(false);
    setDraft(value ?? "");
    setError(null);
  };

  const submit = async () => {
    if (draft === (value ?? "")) {
      setEditing(false);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(draft);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cn("group min-w-0 space-y-1", className)}>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {editing && !readOnly ? (
        <div className="flex items-start gap-1">
          <div className="flex-1">
            {renderEditor ? (
              renderEditor({
                value: draft,
                setValue: setDraft,
                submit,
                cancel,
              })
            ) : (
              <Input
                ref={inputRef}
                type={type}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={submit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    cancel();
                  }
                }}
                placeholder={placeholder}
                disabled={submitting}
                aria-invalid={Boolean(error)}
                className="h-8 text-sm"
              />
            )}
            {error ? (
              <p role="alert" className="mt-1 text-xs text-danger">
                {error}
              </p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={cancel}
            aria-label="Cancelar edición"
            className="size-7"
            disabled={submitting}
          >
            <X className="size-3.5" aria-hidden />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => !readOnly && setEditing(true)}
          disabled={readOnly}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-md px-1.5 py-1 text-left text-sm",
            "transition-colors",
            !readOnly && "hover:bg-muted focus-visible:bg-muted",
            readOnly && "cursor-default",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-label={
            readOnly ? `${label} (solo lectura)` : `Editar ${label}`
          }
        >
          <span className={cn("min-w-0 truncate", !value && "text-muted-foreground italic")}>
            {displayValue ?? value ?? "—"}
          </span>
          {!readOnly ? (
            <Pencil
              className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60"
              aria-hidden
            />
          ) : null}
        </button>
      )}
    </div>
  );
}
