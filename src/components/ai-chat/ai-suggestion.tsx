"use client";

import { useState, useCallback } from "react";
import { Sparkles, Check, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * AiSuggestion -- reusable inline badge/chip for AI-powered field suggestions.
 *
 * Shows a sparkle icon with the suggestion text. Clickable to apply.
 * Can appear next to any form field.
 *
 * Usage:
 *   <AiSuggestion
 *     suggestion="5.75 kW"
 *     explanation="Potencia optima basada en consumo SIPS"
 *     onApply={(value) => form.setValue("power", value)}
 *   />
 */

export interface AiSuggestionProps {
  /** The suggested value to display and apply. */
  suggestion: string;
  /** Short explanation of why this is suggested. */
  explanation: string;
  /** Callback when user accepts the suggestion. */
  onApply?: (value: string) => void;
  /** Whether this is a warning (no apply action, just info). */
  isWarning?: boolean;
  className?: string;
}

export function AiSuggestion({
  suggestion,
  explanation,
  onApply,
  isWarning = false,
  className,
}: AiSuggestionProps) {
  const [dismissed, setDismissed] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApply = useCallback(() => {
    if (onApply && suggestion) {
      onApply(suggestion);
      setApplied(true);
    }
  }, [onApply, suggestion]);

  if (dismissed) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-xs",
        isWarning
          ? "border-warning/30 bg-warning/5 text-warning-foreground"
          : "border-brand/30 bg-brand/5 text-foreground",
        applied && "border-success/30 bg-success/5",
        className,
      )}
      role="status"
    >
      <Sparkles
        className={cn(
          "mt-0.5 size-3.5 shrink-0",
          isWarning ? "text-warning" : "text-brand",
          applied && "text-success",
        )}
        aria-hidden
      />
      <div className="flex-1">
        <p className="text-muted-foreground">{explanation}</p>
        {suggestion && !isWarning ? (
          <p className="mt-0.5 font-medium">
            {applied ? "Aplicado" : suggestion}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!applied && !isWarning && onApply ? (
          <button
            type="button"
            onClick={handleApply}
            className="rounded p-0.5 hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label={`Aplicar sugerencia: ${suggestion}`}
          >
            <Check className="size-3.5 text-brand" aria-hidden />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded p-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Descartar sugerencia"
        >
          <X className="size-3.5 text-muted-foreground" aria-hidden />
        </button>
      </div>
    </div>
  );
}
