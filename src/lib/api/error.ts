/**
 * ApiError — error tipado para respuestas no-2xx del backend.
 *
 * El backend serializa los errores en formato **RFC 7807 (Problem Details)**:
 *
 *   {
 *     "type": "https://errors.panda.energy/leads/duplicate",
 *     "title": "Lead ya existe",
 *     "status": 409,
 *     "detail": "Ya hay un lead con email maria@ejemplo.com",
 *     "instance": "/v1/leads",
 *     "correlationId": "..."
 *   }
 *
 * Esta clase envuelve esos campos para que el frontend pueda mostrar mensajes
 * legibles + arrastrar el `correlationId` a Sentry / logs sin tener que
 * reinterpretar el cuerpo en cada `catch`.
 *
 * Convención:
 *  - Si la respuesta NO es JSON o no respeta el formato Problem, se
 *    sintetiza un Problem con `type: "about:blank"` y el status crudo.
 *  - `correlationId` también puede venir en el header `x-correlation-id`;
 *    si está en ambos, prevalece el del cuerpo.
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  correlationId?: string;
}

export class ApiError extends Error {
  public readonly type: string;
  public readonly title: string;
  public readonly status: number;
  public readonly detail?: string;
  public readonly instance?: string;
  public readonly correlationId?: string;

  constructor(problem: ProblemDetails, responseCorrelationId?: string) {
    // `message` es lo que se ve en `instanceof Error`. Priorizamos `detail`
    // para que `console.error(err)` sea útil sin tener que abrir el objeto.
    super(problem.detail ?? problem.title);
    this.name = "ApiError";
    this.type = problem.type;
    this.title = problem.title;
    this.status = problem.status;
    this.detail = problem.detail;
    this.instance = problem.instance;
    this.correlationId = problem.correlationId ?? responseCorrelationId;
  }
}

/**
 * Type guard que mantiene narrowing de TS sin tener que recurrir a `as`.
 */
export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/**
 * Construye un `ApiError` a partir de una `Response` no-OK. Tolera respuestas
 * que NO son Problem RFC 7807 (fallbacks limpios).
 */
export async function apiErrorFromResponse(response: Response): Promise<ApiError> {
  const correlationId = response.headers.get("x-correlation-id") ?? undefined;
  const contentType = response.headers.get("content-type") ?? "";

  // Si el servidor devolvió Problem JSON, lo parseamos. Si no, sintetizamos.
  if (
    contentType.includes("application/problem+json") ||
    contentType.includes("application/json")
  ) {
    try {
      const body = (await response.json()) as Partial<ProblemDetails>;
      const problem: ProblemDetails = {
        type: typeof body.type === "string" ? body.type : "about:blank",
        title:
          typeof body.title === "string" ? body.title : response.statusText,
        status:
          typeof body.status === "number" ? body.status : response.status,
        detail: typeof body.detail === "string" ? body.detail : undefined,
        instance: typeof body.instance === "string" ? body.instance : undefined,
        correlationId:
          typeof body.correlationId === "string" ? body.correlationId : undefined,
      };
      return new ApiError(problem, correlationId);
    } catch {
      // Cuerpo no parseable como JSON — caemos al fallback abajo.
    }
  }

  return new ApiError(
    {
      type: "about:blank",
      title: response.statusText || "Error",
      status: response.status,
    },
    correlationId,
  );
}

// ---------------------------------------------------------------------------
// NetworkError — errores de red clasificados para UX diferenciada
// ---------------------------------------------------------------------------

/**
 * Tipos de error de red para UX diferenciada.
 */
export type NetworkErrorKind = "offline" | "timeout" | "dns" | "cors" | "unknown";

export class NetworkError extends Error {
  public readonly kind: NetworkErrorKind;

  constructor(kind: NetworkErrorKind, cause?: unknown) {
    const messages: Record<NetworkErrorKind, string> = {
      offline: "Sin conexión a Internet",
      timeout: "La solicitud tardó demasiado — inténtalo de nuevo",
      dns: "No se pudo contactar con el servidor",
      cors: "El servidor rechazó la solicitud (CORS)",
      unknown: "Error de conexión — inténtalo de nuevo",
    };
    super(messages[kind], { cause });
    this.name = "NetworkError";
    this.kind = kind;
  }
}

export function isNetworkError(value: unknown): value is NetworkError {
  return value instanceof NetworkError;
}

/**
 * Clasifica un error de fetch nativo en un NetworkError con kind específico.
 */
export function classifyNetworkError(err: unknown): NetworkError {
  if (err instanceof DOMException && err.name === "AbortError") {
    return new NetworkError("timeout", err);
  }
  if (err instanceof DOMException && err.name === "TimeoutError") {
    return new NetworkError("timeout", err);
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return new NetworkError("offline", err);
  }
  if (err instanceof TypeError) {
    const msg = err.message.toLowerCase();
    if (msg.includes("cors") || msg.includes("cross-origin")) {
      return new NetworkError("cors", err);
    }
    if (msg.includes("failed to fetch") || msg.includes("network")) {
      // Could be DNS, firewall, or general network
      return new NetworkError("dns", err);
    }
  }
  return new NetworkError("unknown", err);
}
