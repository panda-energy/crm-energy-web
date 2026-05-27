"use client";

import {
  QuoteCalculateResponseSchema,
  type QuoteCalculateRequest,
  type QuoteCalculateResponse,
} from "../zod-schemas";
import { useApiMutation } from "./use-api-mutation";

/**
 * Hook tipado para el endpoint de cálculo de ahorro (Sprint 3).
 *
 * `POST /v1/quotes/calculate` — stateless, no invalida cache.
 * Idempotency-Key auto por ser POST con side-effect potencial
 * (aunque el backend lo trata como cálculo puro).
 */

export function useCalculateQuote() {
  return useApiMutation<
    "/v1/quotes/calculate",
    "post",
    typeof QuoteCalculateResponseSchema
  >("/v1/quotes/calculate", {
    method: "POST",
    idempotencyKey: "auto",
    schema: QuoteCalculateResponseSchema,
  });
}

// Re-exports
export type { QuoteCalculateRequest, QuoteCalculateResponse };
