"use client";

import type { AtrMessage, AtrMessageStatus } from "@/lib/api/types-sprint4";
import { cn } from "@/lib/utils/cn";
import { Check, X } from "lucide-react";

/**
 * Horizontal stepper showing the ATR message lifecycle:
 * pending -> sent -> ack_received -> processed
 * (or rejected at any step after sent)
 */

interface Step {
  key: AtrMessageStatus;
  label: string;
}

const STEPS: Step[] = [
  { key: "pending", label: "Pendiente" },
  { key: "sent", label: "Enviado" },
  { key: "ack_received", label: "ACK" },
  { key: "processed", label: "Procesado" },
];

const STATUS_ORDER: Record<AtrMessageStatus, number> = {
  pending: 0,
  sent: 1,
  ack_received: 2,
  processed: 3,
  rejected: -1,
  timeout: -2,
};

function formatTimestamp(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function getTimestampForStep(
  message: AtrMessage,
  stepKey: AtrMessageStatus,
): string | null {
  switch (stepKey) {
    case "pending":
      return message.created_at;
    case "sent":
      return message.sent_at;
    case "ack_received":
      return message.ack_at;
    case "processed":
      return message.processed_at;
    default:
      return null;
  }
}

interface AtrStatusTimelineProps {
  message: AtrMessage;
  className?: string;
}

export function AtrStatusTimeline({
  message,
  className,
}: AtrStatusTimelineProps) {
  const currentOrder = STATUS_ORDER[message.status];
  const isTerminalError =
    message.status === "rejected" || message.status === "timeout";

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Horizontal stepper */}
      <div className="flex items-start gap-0">
        {STEPS.map((step, idx) => {
          const stepOrder = STATUS_ORDER[step.key];
          const isCompleted = !isTerminalError && currentOrder >= stepOrder;
          const isCurrent =
            !isTerminalError && message.status === step.key;
          const timestamp = getTimestampForStep(message, step.key);

          return (
            <div key={step.key} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {idx > 0 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1",
                      isCompleted ? "bg-green-500" : "bg-border",
                    )}
                  />
                )}
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                    isCompleted &&
                      "border-green-500 bg-green-500 text-white",
                    isCurrent &&
                      "border-green-500 bg-green-500 text-white ring-2 ring-green-200 dark:ring-green-800",
                    !isCompleted &&
                      !isCurrent &&
                      "border-border bg-surface text-muted-foreground",
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    idx + 1
                  )}
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1",
                      !isTerminalError && currentOrder > stepOrder
                        ? "bg-green-500"
                        : "bg-border",
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-center text-xs",
                  isCurrent ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
              {timestamp && (
                <span className="text-center text-[10px] text-muted-foreground">
                  {formatTimestamp(timestamp)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Terminal error badge */}
      {isTerminalError && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
            message.status === "rejected"
              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
              : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
          )}
        >
          <X className="size-4 shrink-0" aria-hidden />
          <div>
            <span className="font-medium">
              {message.status === "rejected" ? "Rechazado" : "Timeout"}
            </span>
            {message.last_error && (
              <p className="mt-0.5 text-xs opacity-80">
                {message.last_error}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
