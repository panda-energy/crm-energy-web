"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { AtrMessage, AtrMessageStatus } from "@/lib/api/types-sprint4";
import {
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  Timer,
  FileCheck2,
} from "lucide-react";
import type { ReactNode } from "react";

interface StatCard {
  label: string;
  icon: ReactNode;
  status: AtrMessageStatus;
  className: string;
}

const STAT_CARDS: StatCard[] = [
  {
    label: "Pendientes",
    icon: <Clock className="size-4" aria-hidden />,
    status: "pending",
    className: "text-yellow-600 dark:text-yellow-400",
  },
  {
    label: "Enviados",
    icon: <Send className="size-4" aria-hidden />,
    status: "sent",
    className: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "ACK",
    icon: <FileCheck2 className="size-4" aria-hidden />,
    status: "ack_received",
    className: "text-indigo-600 dark:text-indigo-400",
  },
  {
    label: "Procesados",
    icon: <CheckCircle2 className="size-4" aria-hidden />,
    status: "processed",
    className: "text-green-600 dark:text-green-400",
  },
  {
    label: "Rechazados",
    icon: <XCircle className="size-4" aria-hidden />,
    status: "rejected",
    className: "text-red-600 dark:text-red-400",
  },
  {
    label: "Timeout",
    icon: <Timer className="size-4" aria-hidden />,
    status: "timeout",
    className: "text-orange-600 dark:text-orange-400",
  },
];

interface AtrStatsCardsProps {
  messages: AtrMessage[];
}

export function AtrStatsCards({ messages }: AtrStatsCardsProps) {
  const counts = new Map<AtrMessageStatus, number>();
  for (const m of messages) {
    counts.set(m.status, (counts.get(m.status) ?? 0) + 1);
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {STAT_CARDS.map((card) => (
        <Card key={card.status} className="bg-surface">
          <CardContent className="flex items-center gap-3 p-4">
            <div className={card.className}>{card.icon}</div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {counts.get(card.status) ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
