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
