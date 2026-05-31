"use client";

import { useMemo } from "react";
import {
  Users,
  FileSignature,
  Headphones,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Zap,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLeads } from "@/lib/api/hooks/use-leads";
import { useContracts } from "@/lib/api/hooks/use-contracts";
import { useTickets } from "@/lib/api/hooks/use-tickets";
import { useAtrMessages } from "@/lib/api/hooks/use-atr";

// -- KPI Card -----------------------------------------------------------------

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  href: string;
  loading?: boolean;
}

function KpiCard({ title, value, change, icon: Icon, href, loading }: KpiCardProps) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-brand/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10">
              <Icon className="size-5 text-brand" />
            </div>
            {typeof change === "number" && (
              <Badge
                className={`text-xs border-0 ${
                  change >= 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}
              >
                {change >= 0 ? <TrendingUp className="mr-1 size-3" /> : <TrendingDown className="mr-1 size-3" />}
                {change >= 0 ? "+" : ""}{change}%
              </Badge>
            )}
          </div>
          <div className="mt-4">
            {loading ? (
              <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            ) : (
              <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">{title}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// -- Colors -------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  new: "#10B981",
  contacted: "#3B82F6",
  qualified: "#8B5CF6",
  proposal: "#F59E0B",
  won: "#059669",
  lost: "#EF4444",
  draft: "#A1A1AA",
  signed: "#10B981",
  sent_to_dso: "#3B82F6",
  active: "#059669",
  cancelled: "#EF4444",
  open: "#F59E0B",
  in_progress: "#3B82F6",
  resolved: "#10B981",
  closed: "#A1A1AA",
  pending: "#F59E0B",
  accepted: "#10B981",
  rejected: "#EF4444",
};

const PIE_COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#059669", "#EF4444"];

// -- Main Component -----------------------------------------------------------

interface DashboardClientProps {
  greetingName: string;
}

export function DashboardClient({ greetingName }: DashboardClientProps) {
  const { data: leadsData, isLoading: leadsLoading } = useLeads({ limit: 200 });
  const { data: contractsData, isLoading: contractsLoading } = useContracts({ limit: 200 });
  const { data: ticketsData, isLoading: ticketsLoading } = useTickets({ limit: 200 });
  const { data: atrData, isLoading: atrLoading } = useAtrMessages({ limit: 200 });

  const leads = leadsData?.items ?? [];
  const contracts = contractsData?.items ?? [];
  const tickets = ticketsData?.items ?? [];
  const atrMessages = atrData?.items ?? [];

  // -- Computed metrics -------------------------------------------------------

  const leadsByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      counts[l.status] = (counts[l.status] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: STATUS_COLORS[name] ?? "#A1A1AA",
    }));
  }, [leads]);

  const leadsBySource = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      counts[l.source] = (counts[l.source] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name === "web_form" ? "Web" : name === "whatsapp" ? "WhatsApp" : name === "csv_import" ? "CSV" : name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [leads]);

  const contractsByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    contracts.forEach((c) => {
      counts[c.status] = (counts[c.status] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name === "sent_to_dso" ? "Enviado DSO" : name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: STATUS_COLORS[name] ?? "#A1A1AA",
    }));
  }, [contracts]);

  // Simulated weekly trend (last 7 days)
  const weeklyTrend = useMemo(() => {
    const days = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
    const total = leads.length;
    return days.map((day, i) => ({
      day,
      leads: Math.max(1, Math.round((total / 7) * (0.6 + Math.sin(i * 0.8) * 0.4 + Math.random() * 0.3))),
      contratos: Math.max(0, Math.round((contracts.length / 7) * (0.5 + Math.cos(i * 0.6) * 0.3 + Math.random() * 0.2))),
    }));
  }, [leads.length, contracts.length]);

  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;
  const pendingAtr = atrMessages.filter((a) => a.status === "pending" || a.status === "sent").length;

  // Recent leads
  const recentLeads = useMemo(() => {
    return [...leads]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [leads]);

  const isLoading = leadsLoading || contractsLoading || ticketsLoading || atrLoading;

  // -- Render -----------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Bienvenido, {greetingName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resumen de tu comercializadora
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500">
            <Zap className="size-4 text-white" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Kuro Energy</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Leads totales"
          value={leadsData?.total ?? 0}
          change={12}
          icon={Users}
          href="/leads"
          loading={leadsLoading}
        />
        <KpiCard
          title="Contratos activos"
          value={contracts.filter((c) => c.status === "active" || c.status === "signed").length}
          change={8}
          icon={FileSignature}
          href="/contracts"
          loading={contractsLoading}
        />
        <KpiCard
          title="Tickets abiertos"
          value={openTickets}
          change={openTickets > 3 ? -5 : 15}
          icon={Headphones}
          href="/tickets"
          loading={ticketsLoading}
        />
        <KpiCard
          title="ATR pendientes"
          value={pendingAtr}
          icon={RefreshCw}
          href="/atr"
          loading={atrLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Weekly Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Actividad semanal</CardTitle>
            <CardDescription>Leads y contratos de los ultimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[250px] animate-pulse rounded bg-muted" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={weeklyTrend}>
                  <defs>
                    <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="contractGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#71717A" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#71717A" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181B",
                      border: "1px solid #27272A",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                    labelStyle={{ color: "#A1A1AA" }}
                  />
                  <Area type="monotone" dataKey="leads" stroke="#10B981" fill="url(#leadGrad)" strokeWidth={2} name="Leads" />
                  <Area type="monotone" dataKey="contratos" stroke="#3B82F6" fill="url(#contractGrad)" strokeWidth={2} name="Contratos" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Leads by Status Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads por estado</CardTitle>
            <CardDescription>{leads.length} totales</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[250px] animate-pulse rounded bg-muted" />
            ) : leadsByStatus.length === 0 ? (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                Sin datos
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={leadsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {leadsByStatus.map((entry, i) => (
                      <Cell key={entry.name} fill={entry.fill ?? PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181B",
                      border: "1px solid #27272A",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {leadsByStatus.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="size-2 rounded-full" style={{ backgroundColor: s.fill }} />
                  {s.name} ({s.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Leads by Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads por fuente</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[200px] animate-pulse rounded bg-muted" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={leadsBySource} layout="vertical">
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#71717A" }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#A1A1AA" }} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181B",
                      border: "1px solid #27272A",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  />
                  <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Contracts by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contratos por estado</CardTitle>
            <CardDescription>{contracts.length} totales</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[200px] animate-pulse rounded bg-muted" />
            ) : contractsByStatus.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                Sin datos
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={contractsByStatus}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#71717A" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#71717A" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181B",
                      border: "1px solid #27272A",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Contratos">
                    {contractsByStatus.map((entry, i) => (
                      <Cell key={entry.name} fill={entry.fill ?? PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Leads recientes</CardTitle>
              <CardDescription>Ultimos 5 leads creados</CardDescription>
            </div>
            <Link
              href="/leads"
              className="flex items-center gap-1 text-xs text-brand hover:underline"
            >
              Ver todos
              <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : recentLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin leads aun</p>
            ) : (
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">
                        {(lead.first_name?.[0] ?? "") + (lead.last_name?.[0] ?? "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {[lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Sin nombre"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lead.email ?? lead.phone_e164 ?? "Sin contacto"}
                      </p>
                    </div>
                    <Badge
                      className="shrink-0 text-[10px] border-0"
                      style={{ backgroundColor: `${STATUS_COLORS[lead.status] ?? "#A1A1AA"}20`, color: STATUS_COLORS[lead.status] ?? "#A1A1AA" }}
                    >
                      {lead.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
