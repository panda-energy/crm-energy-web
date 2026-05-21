"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isApiError } from "@/lib/api/error";

/**
 * Error boundary del CRM autenticado.
 *
 * Captura excepciones lanzadas durante el render (incluyendo errores de
 * TanStack Query en modo `throwOnError`). Discrimina:
 *  - `ApiError` con `status < 500` → muestra `title` + `detail` legibles.
 *  - `ApiError` 5xx → mensaje genérico de servidor + retry.
 *  - Otros → "Algo no fue bien" + retry.
 *
 * `reset()` reinicia el subárbol — TanStack Query reintentará la query que
 * falló. `correlationId` se muestra si está disponible para que QA / soporte
 * lo pidan al usuario.
 *
 * Nivel: solo dentro de `(authenticated)`. La landing pública usa el de Next
 * por defecto. El `global-error` cubre el root.
 */

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AuthenticatedError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // reason: log con contexto, no `console.log`. En prod este punto se
    // engancha a Sentry (DevOps lo cablea con `instrumentation-client.ts`).
    console.error("[CRM] error boundary capturó", error);
  }, [error]);

  const isApi = isApiError(error);
  const isServerError = isApi && error.status >= 500;
  const isClientError = isApi && error.status < 500 && error.status >= 400;

  const title = isApi
    ? isServerError
      ? "Algo no fue bien en el servidor"
      : error.title
    : "Algo no fue bien";

  const description = isApi
    ? isServerError
      ? "Volvelo a intentar en unos segundos. Si persiste, contacta con soporte."
      : (error.detail ?? "La operación no pudo completarse.")
    : "Reintenta la acción. Si el problema persiste, contacta con soporte.";

  const correlationId = isApi ? error.correlationId : undefined;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-md space-y-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger">
          <AlertTriangle aria-hidden className="size-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
          {isClientError && (
            <p className="text-xs text-muted-foreground">
              Código: {error.status}
            </p>
          )}
        </div>
        <Button onClick={reset} type="button">
          Reintentar
        </Button>
        {correlationId && (
          <p className="text-xs text-muted-foreground">
            Referencia para soporte:{" "}
            <code className="font-mono">{correlationId}</code>
          </p>
        )}
      </div>
    </div>
  );
}
