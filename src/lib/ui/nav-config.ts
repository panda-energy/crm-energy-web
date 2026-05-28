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
  /** i18n key for translation (e.g. "nav.dashboard"). */
  i18nKey: string;
}

export const navItems: ReadonlyArray<NavItem> = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, i18nKey: "nav.dashboard" },
  { label: "Leads", href: "/leads", icon: Users, i18nKey: "nav.leads" },
  { label: "Pipeline", href: "/pipeline", icon: BarChart3, i18nKey: "nav.pipeline" },
  { label: "CUPS", href: "/cups", icon: Building2, i18nKey: "nav.cups" },
  { label: "Contratos", href: "/contracts", icon: FileText, i18nKey: "nav.contracts" },
  { label: "ATR", href: "/atr", icon: Tag, i18nKey: "nav.atr" },
  { label: "Tickets", href: "/tickets", icon: Inbox, i18nKey: "nav.tickets" },
  { label: "Comisiones", href: "/commissions", icon: Wallet, i18nKey: "nav.commissions" },
  { label: "Configuracion", href: "/settings", icon: Settings, i18nKey: "nav.settings" },
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
