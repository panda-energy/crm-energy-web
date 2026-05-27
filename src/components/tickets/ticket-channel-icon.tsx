"use client";

import { MessageSquare, Mail, Phone, MessagesSquare } from "lucide-react";
import type { TicketChannel } from "@/lib/api/types-sprint4";
import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

const CHANNEL_CONFIG: Record<
  TicketChannel,
  { label: string; icon: ReactNode; className: string }
> = {
  whatsapp: {
    label: "WhatsApp",
    icon: <MessageSquare className="size-4" />,
    className: "text-green-600 dark:text-green-400",
  },
  email: {
    label: "Email",
    icon: <Mail className="size-4" />,
    className: "text-blue-600 dark:text-blue-400",
  },
  chat: {
    label: "Chat",
    icon: <MessagesSquare className="size-4" />,
    className: "text-purple-600 dark:text-purple-400",
  },
  phone: {
    label: "Telefono",
    icon: <Phone className="size-4" />,
    className: "text-orange-600 dark:text-orange-400",
  },
};

interface TicketChannelIconProps {
  channel: TicketChannel;
  showLabel?: boolean;
  className?: string;
}

export function TicketChannelIcon({
  channel,
  showLabel = false,
  className,
}: TicketChannelIconProps) {
  const config = CHANNEL_CONFIG[channel];
  return (
    <span
      className={cn("inline-flex items-center gap-1", config.className, className)}
      title={config.label}
      aria-label={config.label}
    >
      {config.icon}
      {showLabel && <span className="text-xs">{config.label}</span>}
    </span>
  );
}
