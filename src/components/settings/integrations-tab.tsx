"use client";

import {
  Shield,
  PenTool,
  Database,
  MessageSquare,
  Mail,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  connected: boolean;
  provider: string;
}

const INTEGRATIONS: ReadonlyArray<Integration> = [
  {
    id: "clerk",
    name: "Autenticacion",
    description: "Inicio de sesion, SSO y gestion de usuarios",
    icon: Shield,
    connected: true,
    provider: "Clerk",
  },
  {
    id: "signaturit",
    name: "Firma digital",
    description: "Firma electronica avanzada de contratos",
    icon: PenTool,
    connected: true,
    provider: "Signaturit",
  },
  {
    id: "cnmc",
    name: "CNMC SIPS",
    description: "Consulta de datos del punto de suministro",
    icon: Database,
    connected: true,
    provider: "CNMC",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Comunicacion con clientes via WhatsApp",
    icon: MessageSquare,
    connected: false,
    provider: "Meta Business API",
  },
  {
    id: "email",
    name: "Email",
    description: "Envio de notificaciones y contratos por email",
    icon: Mail,
    connected: true,
    provider: "SMTP",
  },
];

/**
 * Integrations tab -- readonly cards showing connection status
 * for each third-party service. Configuration is managed by DevOps.
 */
export function IntegrationsTab() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {INTEGRATIONS.map((integration) => (
        <IntegrationCard key={integration.id} integration={integration} />
      ))}
    </div>
  );
}

function IntegrationCard({ integration }: { integration: Integration }) {
  const Icon = integration.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-sm">{integration.name}</CardTitle>
              <CardDescription className="text-xs">
                {integration.provider}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={integration.connected ? "default" : "secondary"}
            className="text-xs"
          >
            {integration.connected ? "Conectado" : "No configurado"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{integration.description}</p>
      </CardContent>
    </Card>
  );
}
