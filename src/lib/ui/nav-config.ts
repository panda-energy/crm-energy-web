import {
  BarChart3,
  Building2,
  FileText,
  Inbox,
  LayoutDashboard,
  Settings,
  Tag,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * Configuración de navegación del CRM (sidebar + diccionario breadcrumbs).
 *
 * Las rutas reales (`/leads`, `/pipeline`, `/cups`, …) las construyen los
 * sprints siguientes. Aquí solo el chasis: items placeholder + labels para
 * los breadcrumbs.
 */
export interface NavItem {
  /** Etiqueta visible en sidebar y breadcrumbs (`es-ES`). */
  label: string;
  /** Ruta absoluta (segmento raíz). */
  href: string;
  /** Icono Lucide para sidebar. */
  icon: LucideIcon;
}

export const navItems: ReadonlyArray<NavItem> = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Pipeline", href: "/pipeline", icon: BarChart3 },
  { label: "CUPS", href: "/cups", icon: Building2 },
  { label: "Contratos", href: "/contracts", icon: FileText },
  { label: "ATR", href: "/atr", icon: Tag },
  { label: "Tickets", href: "/tickets", icon: Inbox },
  { label: "Comisiones", href: "/commissions", icon: Wallet },
  { label: "Configuración", href: "/settings", icon: Settings },
];

/**
 * Mapa de segmento de ruta → label en castellano. Lo consumen las
 * breadcrumbs para no inferir labels desde el path en crudo.
 *
 * Las claves son el segmento literal (sin `/`) — siempre en inglés,
 * el valor es el display en castellano. Si una clave no existe, el
 * componente Breadcrumbs hace fallback a capitalizar el segmento.
 */
export const segmentLabels: Record<string, string> = {
  dashboard: "Dashboard",
  leads: "Leads",
  pipeline: "Pipeline",
  cups: "CUPS",
  contracts: "Contratos",
  atr: "ATR",
  tickets: "Tickets",
  commissions: "Comisiones",
  settings: "Configuración",
  nuevo: "Nuevo",
  editar: "Editar",
};
