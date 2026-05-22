"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { useCmdkStore } from "@/lib/ui/cmdk-store";

/**
 * Boundary del Command Palette para defer de bundle.
 *
 * El `CommandPalette` real arrastra cmdk + Radix Dialog + lucide-react +
 * los hooks de búsqueda de leads/pipelines. Aunque cmdk en sí es ligero
 * (~8 kB minified), sus dependencias indirectas y los iconos suman al
 * shared chunk del layout autenticado.
 *
 * Estrategia: NO importar el componente hasta que el usuario realmente
 * lo invoque (primer `mod+k` o tap en el trigger del topbar). Mientras
 * tanto, montamos un mini-listener que sólo intercepta el atajo y
 * "armado" la carga.
 *
 * Tras el primer mount, el componente queda montado durante toda la
 * sesión (no lo desmontamos al cerrar el dialog — la diferencia de bundle
 * ya está cobrada y desmontarlo provocaría latencia en el siguiente
 * `mod+k`).
 *
 * Diseño deliberadamente conservador: si en el futuro queremos un trigger
 * remoto (botón en topbar móvil, deep link), basta con tocar el store
 * `useCmdkStore` y este boundary reacciona.
 */

const LazyCommandPalette = dynamic(
  () =>
    import("./command-palette").then((m) => ({ default: m.CommandPalette })),
  {
    ssr: false,
    loading: () => null,
  },
);

export function CommandPaletteBoundary() {
  const [armed, setArmed] = useState(false);
  const open = useCmdkStore((s) => s.open);
  const toggle = useCmdkStore((s) => s.toggle);

  // reason: el listener real del shortcut vive dentro del CommandPalette,
  // pero hasta que esté cargado no existe. Este listener mínimo dispara
  // el primer toggle (que también arma la carga vía `setArmed(true)`)
  // y se autodesmonta. No es UI: solo registra event listener.
  useEffect(() => {
    if (armed) return undefined;
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setArmed(true);
        toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [armed, toggle]);

  // reason: si algo (ej. botón del topbar) abre el palette antes del primer
  // shortcut, también activamos la carga real.
  useEffect(() => {
    if (open && !armed) setArmed(true);
  }, [open, armed]);

  if (!armed) return null;
  return <LazyCommandPalette />;
}
