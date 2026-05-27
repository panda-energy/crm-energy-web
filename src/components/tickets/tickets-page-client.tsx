"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus, Ticket as TicketIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useTickets } from "@/lib/api/hooks/use-tickets";
import type { Ticket, TicketStatus } from "@/lib/api/types-sprint4";
import { TicketListItem } from "./ticket-list-item";
import { TicketConversation } from "./ticket-conversation";
import { CreateTicketDialog } from "./create-ticket-dialog";

type StatusTab = TicketStatus | "all";

/**
 * Inbox-style tickets page.
 * Left panel: filtered ticket list. Right panel: selected ticket conversation.
 */
export function TicketsPageClient() {
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const queryParams = useMemo(() => {
    const params: {
      status?: TicketStatus[];
      q?: string;
      limit?: number;
    } = { limit: 50 };

    if (statusTab !== "all") {
      params.status = [statusTab];
    }
    if (search.trim()) {
      params.q = search.trim();
    }
    return params;
  }, [statusTab, search]);

  const { data, isLoading, isError, error } = useTickets(queryParams);

  const handleSelectTicket = useCallback((ticket: Ticket) => {
    setSelectedTicket(ticket);
  }, []);

  return (
    <div className="flex h-[calc(100vh-theme(spacing.14)-theme(spacing.16))] flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
          <p className="text-sm text-muted-foreground">
            Inbox unificado: WhatsApp, email, chat y telefono.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden />
          Nuevo ticket
        </Button>
      </div>

      {/* Status tabs */}
      <Tabs
        value={statusTab}
        onValueChange={(v) => setStatusTab(v as StatusTab)}
      >
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="open">Abiertos</TabsTrigger>
          <TabsTrigger value="in_progress">En progreso</TabsTrigger>
          <TabsTrigger value="waiting_customer">Esperando</TabsTrigger>
          <TabsTrigger value="resolved">Resueltos</TabsTrigger>
          <TabsTrigger value="closed">Cerrados</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Inbox layout */}
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-surface">
        {/* Left: ticket list */}
        <div className="flex w-full flex-col border-r border-border md:w-80 lg:w-96">
          {/* Search */}
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por asunto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                aria-label="Buscar tickets"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && <TicketListSkeleton />}
            {isError && (
              <div className="p-4 text-sm text-muted-foreground">
                Error: {error?.message}
              </div>
            )}
            {data && data.items.length === 0 && (
              <div className="p-6">
                <EmptyState
                  icon={<TicketIcon />}
                  title="Sin tickets"
                  description="No hay tickets que coincidan con los filtros."
                  action={
                    <Button
                      size="sm"
                      onClick={() => setCreateOpen(true)}
                    >
                      Crear ticket
                    </Button>
                  }
                />
              </div>
            )}
            {data &&
              data.items.map((ticket) => (
                <TicketListItem
                  key={ticket.id}
                  ticket={ticket}
                  isSelected={selectedTicket?.id === ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                />
              ))}
          </div>

          {/* Count */}
          {data && (
            <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              {data.total} tickets
            </div>
          )}
        </div>

        {/* Right: conversation */}
        <div className="hidden flex-1 md:flex md:flex-col">
          {selectedTicket ? (
            <TicketConversation ticket={selectedTicket} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Selecciona un ticket para ver la conversacion
            </div>
          )}
        </div>
      </div>

      {/* Create dialog */}
      <CreateTicketDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}

function TicketListSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-3 px-4 py-3">
          <Skeleton className="size-5 shrink-0 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
