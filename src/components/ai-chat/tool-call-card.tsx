"use client";

import { useCallback } from "react";
import {
  Check,
  X,
  Loader2,
  UserPlus,
  Send,
  FileEdit,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { ToolCall, ToolCallStatus } from "@/lib/api/types-sprint5";
import {
  useApproveToolCall,
  useRejectToolCall,
} from "@/lib/api/hooks/use-chat";

/**
 * ToolCallCard -- renders a tool call in the chat with approve/reject actions.
 *
 * When status is `pending_approval`, shows action buttons.
 * When `executed`, shows the result.
 * When `rejected`, shows "Accion cancelada".
 */

const TOOL_ICONS: Record<string, typeof UserPlus> = {
  create_lead: UserPlus,
  send_atr: Send,
  update_contract: FileEdit,
};

const TOOL_LABELS: Record<string, string> = {
  create_lead: "Crear lead",
  send_atr: "Enviar ATR",
  update_contract: "Actualizar contrato",
};

const STATUS_CONFIG: Record<
  ToolCallStatus,
  { label: string; variant: "default" | "success" | "destructive" | "warning" | "secondary" }
> = {
  pending_approval: { label: "Pendiente", variant: "warning" },
  approved: { label: "Aprobada", variant: "success" },
  executed: { label: "Ejecutada", variant: "success" },
  rejected: { label: "Cancelada", variant: "destructive" },
  failed: { label: "Error", variant: "destructive" },
};

export interface ToolCallCardProps {
  toolCall: ToolCall;
  className?: string;
}

export function ToolCallCard({ toolCall, className }: ToolCallCardProps) {
  const approve = useApproveToolCall();
  const reject = useRejectToolCall();
  const isPending = toolCall.status === "pending_approval";
  const isProcessing = approve.isPending || reject.isPending;

  const Icon = TOOL_ICONS[toolCall.name] ?? Zap;
  const label = TOOL_LABELS[toolCall.name] ?? toolCall.name;
  const statusConfig = STATUS_CONFIG[toolCall.status];

  const handleApprove = useCallback(() => {
    approve.mutate(toolCall.id);
  }, [approve, toolCall.id]);

  const handleReject = useCallback(() => {
    reject.mutate(toolCall.id);
  }, [reject, toolCall.id]);

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-3",
        isPending && "border-warning/50",
        className,
      )}
      role="group"
      aria-label={`Accion: ${label}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-muted">
          <Icon className="size-3.5 text-muted-foreground" aria-hidden />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold">{label}</p>
        </div>
        <Badge variant={statusConfig.variant} className="text-[10px]">
          {statusConfig.label}
        </Badge>
      </div>

      {/* Arguments */}
      <div className="mt-2 rounded-md bg-muted/50 p-2">
        <dl className="space-y-0.5 text-xs">
          {Object.entries(toolCall.arguments).map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <dt className="shrink-0 font-medium text-muted-foreground">
                {key}:
              </dt>
              <dd className="truncate text-foreground">{String(value)}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Result for executed/failed */}
      {toolCall.result ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {toolCall.result}
        </p>
      ) : null}

      {/* Rejection message */}
      {toolCall.status === "rejected" ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Accion cancelada por el usuario.
        </p>
      ) : null}

      {/* Actions */}
      {isPending ? (
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={isProcessing}
            className="flex-1 bg-success text-success-foreground hover:bg-success/90"
          >
            {approve.isPending ? (
              <Loader2 className="mr-1 size-3 animate-spin" aria-hidden />
            ) : (
              <Check className="mr-1 size-3" aria-hidden />
            )}
            Aprobar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleReject}
            disabled={isProcessing}
            className="flex-1"
          >
            {reject.isPending ? (
              <Loader2 className="mr-1 size-3 animate-spin" aria-hidden />
            ) : (
              <X className="mr-1 size-3" aria-hidden />
            )}
            Rechazar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
