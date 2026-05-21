"use client";

import { useEffect } from "react";

/**
 * Global error boundary (last resort).
 *
 * Captura errores ocurridos en el ROOT layout o en el `<html>/<body>` antes
 * de que el árbol normal de la app pueda manejarlos (e.g. fallo de
 * Providers). Por contrato de Next, este componente debe renderizar su
 * propio `<html>` y `<body>` — no hereda nada.
 *
 * Mantenemos la UI deliberadamente simple (HTML inline, sin Tailwind) para
 * evitar regresiones si lo que falló fue la propia carga del CSS.
 */

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[CRM] global-error boundary capturó", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
          background: "#fff",
          color: "#0a0a0a",
          margin: 0,
          padding: "3rem 1.5rem",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: "32rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Panda Energy no pudo cargar
          </h1>
          <p style={{ color: "#555", marginBottom: "1.5rem" }}>
            Recarga la página. Si persiste, contacta con soporte y comparte el
            código de incidente.
          </p>
          {error.digest && (
            <p
              style={{
                color: "#777",
                fontSize: "0.75rem",
                fontFamily: "monospace",
                marginBottom: "1.5rem",
              }}
            >
              {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              background: "#0a0a0a",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
