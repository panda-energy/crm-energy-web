import {
  Building2,
  FileText,
  Inbox,
  Settings,
  Tag,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Placeholder elegante para rutas todavía no implementadas pero
 * mencionadas en el sidebar (CUPS, Contratos, ATR, Tickets, Comisiones,
 * Configuración).
 *
 * Objetivos del componente:
 *  - Comunicar el sprint en el que llega la feature (señal de roadmap).
 *  - Listar 3-5 bullets concretos de qué tendrá la página — gana confianza
 *    durante la demo a inversores / early adopters sin promesas vagas.
 *  - Mantener la misma chrome (sidebar + topbar) que el resto de la app,
 *    centrado y respirando.
 *
 * No fetcha datos. No mantiene estado. No es interactivo.
 *
 * Accesibilidad:
 *  - `role="status"` para que SR anuncie el contenido al navegar.
 *  - El icono lleva `aria-hidden` (decorativo); el título es la fuente
 *    de verdad para asistencias.
 */

const ICONS: Record<ComingSoonIconKey, LucideIcon> = {
  cups: Building2,
  contracts: FileText,
  atr: Tag,
  tickets: Inbox,
  commissions: Wallet,
  settings: Settings,
};

export type ComingSoonIconKey =
  | "cups"
  | "contracts"
  | "atr"
  | "tickets"
  | "commissions"
  | "settings";

export interface ComingSoonPlaceholderProps {
  /** Título en castellano. */
  title: string;
  /** Frase corta (1-2 líneas) que resume el alcance. */
  description: string;
  /** Etiqueta del sprint — ej. "Sprint 3", "Sprint 4". */
  sprintLabel: string;
  /** Clave del icono Lucide; mapea a `ICONS`. */
  iconKey: ComingSoonIconKey;
  /** 3-5 bullets describiendo qué traerá la página. */
  bullets: ReadonlyArray<string>;
}

export function ComingSoonPlaceholder({
  title,
  description,
  sprintLabel,
  iconKey,
  bullets,
}: ComingSoonPlaceholderProps) {
  const Icon = ICONS[iconKey];
  return (
    <div
      role="status"
      className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-5 px-6 py-12 text-center"
    >
      <div className="flex size-16 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        <Icon className="size-8" aria-hidden />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Badge variant="secondary" className="text-xs">
        Disponible en {sprintLabel}
      </Badge>
      <ul className="w-full max-w-md space-y-2 text-left text-sm text-muted-foreground">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span
              aria-hidden
              className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-brand/60"
            />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
