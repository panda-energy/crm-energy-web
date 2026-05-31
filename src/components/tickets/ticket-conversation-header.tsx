"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { XCircle } from "lucide-react";
import type { Ticket } from "@/lib/api/types-sprint4";
import { useUpdateTicket, useCloseTicket } from "@/lib/api/hooks/use-tickets";
import { TicketStatusBadge } from "./ticket-status-badge";
import { TicketPriorityBadge } from "./ticket-priority-badge";
import { TicketChannelIcon } from "./ticket-channel-icon";
import { SlaTimer } from "./sla-timer";
import { USER_IDS } from "@/mocks/fixtures/users";

const ASSIGNEE_OPTIONS = [
  { value: USER_IDS.jorge, label: "Jorge Vega" },
  { value: USER_IDS.lucia, label: "Lucia Romero" },
  { value: USER_IDS.carlos, label: "Carlos Ruiz" },
];

interface TicketConversationHeaderProps {
  ticket: Ticket;
}

export function TicketConversationHeader({
  ticket,
}: TicketConversationHeaderProps) {
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const updateMutation = useUpdateTicket(ticket.id);
  const closeMutation = useCloseTicket(ticket.id);

  const isClosed = ticket.status === "closed";

  function handleAssigneeChange(userId: string) {
    updateMutation.mutate({ assigned_to: userId === "unassigned" ? null : userId || null });
  }

  function handleClose() {
    closeMutation.mutate(undefined, {
      onSuccess: () => setCloseDialogOpen(false),
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <TicketChannelIcon channel={ticket.channel} showLabel />
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">
          {ticket.subject}
        </h2>
        <TicketStatusBadge status={ticket.status} />
        <TicketPriorityBadge priority={ticket.priority} />
        <SlaTimer deadline={ticket.sla_deadline} breached={ticket.sla_breached} />

        {/* Assignee picker */}
        <Select
          value={ticket.assigned_to ?? "unassigned"}
          onValueChange={handleAssigneeChange}
        >
          <SelectTrigger className="w-36 text-xs" aria-label="Asignar a">
            <SelectValue placeholder="Sin asignar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Sin asignar</SelectItem>
            {ASSIGNEE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Close button */}
        {!isClosed && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-red-600 hover:text-red-700 dark:text-red-400"
            onClick={() => setCloseDialogOpen(true)}
          >
            <XCircle className="size-3" aria-hidden />
            Cerrar ticket
          </Button>
        )}
      </div>

      {/* Close confirmation dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cerrar ticket</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cerrar ticket &quot;{ticket.subject}&quot;. Esta accion no se puede deshacer.
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCloseDialogOpen(false)}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleClose}
              disabled={closeMutation.isPending}
            >
              {closeMutation.isPending ? "Cerrando..." : "Cerrar ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
