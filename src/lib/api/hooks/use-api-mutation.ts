"use client";

import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import type { ZodTypeAny } from "zod";
import {
  apiDelete,
  apiPatch,
  apiPost,
  apiPut,
  type ApiRequestOptions,
} from "../client";
import type { paths } from "../types";
import { toast } from "@/lib/ui/toast";
import { useClerkApiContext } from "./clerk-context";

/**
 * useApiMutation — hook tipado para mutaciones contra `paths` de OpenAPI.
 *
 * Garantías:
 *  1. **Multi-tenancy**: inyecta `X-Tenant-Id` automáticamente.
 *  2. **Idempotency-Key**: cuando `idempotencyKey: 'auto'` (recomendado para
 *     POST), se genera UUIDv4 una vez al construir la mutate-fn. Si `'auto'`
 *     se pasa, los retries del usuario usarán el MISMO key — protege contra
 *     duplicados si el primer intento murió en la red pero llegó al backend.
 *  3. **Optimistic update + rollback**: si se pasa `optimistic`, antes de
 *     mandar al servidor actualizamos la cache; si la request falla, hacemos
 *     rollback al snapshot anterior.
 *  4. **Undo de 6s** (regla cross-skill #UX): si se pasa `undo`, tras success
 *     mostramos un toast con botón "Deshacer". El `onUndo` callback corre si
 *     el usuario lo activa antes del timeout. Toast se cierra automáticamente
 *     al ejecutar undo.
 *  5. **Invalidación selectiva**: `invalidates: QueryKey[]` invalida solo
 *     las queries listadas. No se permite invalidar global (anti-patrón).
 *
 * Tipo de body / respuesta: derivados del OpenAPI cuando es posible.
 */

// Métodos de mutación válidos (no-GET).
type MutationMethod = "POST" | "PATCH" | "PUT" | "DELETE";
type MutationMethodLower = Lowercase<MutationMethod>;

// Paths que tienen al menos un método de mutación.
type MutationPath = {
  [P in keyof paths]: paths[P] extends Partial<Record<MutationMethodLower, unknown>>
    ? {
        [M in MutationMethodLower]: paths[P][M] extends undefined ? never : P;
      }[MutationMethodLower]
    : never;
}[keyof paths];

// Body request del path + método (si existe).
type MutationBody<
  P extends keyof paths,
  M extends MutationMethodLower,
> = paths[P][M] extends {
  requestBody: {
    content: { "application/json": infer B };
  };
}
  ? B
  : undefined;

// Respuesta success (2xx) del path + método.
type MutationResponse<
  P extends keyof paths,
  M extends MutationMethodLower,
> = paths[P][M] extends {
  responses: infer R;
}
  ? R extends Record<number, infer V>
    ? V extends {
        content: { "application/json": infer C };
      }
      ? C
      : void
    : void
  : void;

// Path params del método.
type MutationPathParams<
  P extends keyof paths,
  M extends MutationMethodLower,
> = paths[P][M] extends { parameters: { path: infer Pp } } ? Pp : undefined;

export interface OptimisticUpdate<TData> {
  queryKey: QueryKey;
  updater: (old: TData | undefined) => TData;
}

export interface UndoConfig {
  /** Texto del toast. */
  message: string;
  /** Callback cuando el usuario hace click en "Deshacer". */
  onUndo: () => void | Promise<void>;
  /** Texto del botón. Default: "Deshacer". */
  actionLabel?: string;
  /** Duración del toast en ms. Default: 6000. */
  duration?: number;
}

export interface UseApiMutationOptions<
  P extends MutationPath,
  M extends MutationMethodLower,
  TSchema extends ZodTypeAny | undefined,
> extends Omit<
    UseMutationOptions<
      TSchema extends ZodTypeAny
        ? ReturnType<TSchema["parse"]>
        : MutationResponse<P, M>,
      Error,
      MutationBody<P, M>
    >,
    "mutationFn"
  > {
  method: Uppercase<M>;
  /** Path params si la ruta los necesita (`/leads/{leadId}` → `{ leadId }`). */
  pathParams?: MutationPathParams<P, M>;
  /**
   * Idempotency-Key. `'auto'` recomendado para POST. Si se pasa una `string`,
   * se reutiliza entre retries de la misma mutación.
   */
  idempotencyKey?: string | "auto";
  /** Schema Zod opcional para boundary validation de la respuesta. */
  schema?: TSchema;
  /** Optimistic update + rollback automático en error. */
  optimistic?: OptimisticUpdate<unknown>;
  /** Toast con undo de 6s tras success. */
  undo?: UndoConfig;
  /** Lista de queryKeys a invalidar tras success. */
  invalidates?: QueryKey[];
  /** Headers extra. */
  headers?: Record<string, string>;
}

const HTTP_FN: Record<MutationMethod, typeof apiPost> = {
  POST: apiPost,
  PATCH: apiPatch,
  PUT: apiPut,
  // DELETE no acepta body pero su firma es compatible con `(path, body, opts)`
  // si `body` se ignora; lo envolvemos.
  DELETE: ((path: string, _body: unknown, opts: ApiRequestOptions) =>
    apiDelete(path, opts)) as typeof apiPost,
};

export function useApiMutation<
  P extends MutationPath,
  M extends MutationMethodLower,
  TSchema extends ZodTypeAny | undefined = undefined,
>(
  path: P,
  options: UseApiMutationOptions<P, M, TSchema>,
): UseMutationResult<
  TSchema extends ZodTypeAny
    ? ReturnType<TSchema["parse"]>
    : MutationResponse<P, M>,
  Error,
  MutationBody<P, M>
> {
  const { getToken, tenantId } = useClerkApiContext();
  const queryClient = useQueryClient();

  const {
    method,
    pathParams,
    idempotencyKey,
    schema,
    optimistic,
    undo,
    invalidates,
    headers,
    onMutate: callerOnMutate,
    onError: callerOnError,
    onSuccess: callerOnSuccess,
    ...mutationOptions
  } = options;

  type TData = TSchema extends ZodTypeAny
    ? ReturnType<TSchema["parse"]>
    : MutationResponse<P, M>;
  type TBody = MutationBody<P, M>;
  type TContext = {
    previousData?: unknown;
    resolvedIdempotencyKey?: string;
  };

  return useMutation<TData, Error, TBody, TContext>({
    mutationFn: async (body) => {
      const apiOpts: ApiRequestOptions = {
        getToken,
        tenantId,
        headers,
      };
      if (pathParams) {
        apiOpts.pathParams = pathParams as Record<string, string | number>;
      }
      if (idempotencyKey) {
        apiOpts.idempotencyKey = idempotencyKey;
      }
      const fn = HTTP_FN[method as MutationMethod];
      const response = await fn(path, body, apiOpts);
      if (schema) {
        return schema.parse(response) as TData;
      }
      return response as TData;
    },

    onMutate: async (variables, mutationContext) => {
      let context: TContext = {};
      if (optimistic) {
        await queryClient.cancelQueries({ queryKey: optimistic.queryKey });
        const previousData = queryClient.getQueryData<unknown>(optimistic.queryKey);
        queryClient.setQueryData(
          optimistic.queryKey,
          optimistic.updater(previousData),
        );
        context = { previousData };
      }
      if (callerOnMutate) {
        const callerCtx = await callerOnMutate(variables, mutationContext);
        if (callerCtx && typeof callerCtx === "object") {
          context = { ...context, ...callerCtx };
        }
      }
      return context;
    },

    onError: (error, variables, onMutateResult, mutationContext) => {
      if (optimistic && onMutateResult?.previousData !== undefined) {
        queryClient.setQueryData(optimistic.queryKey, onMutateResult.previousData);
      }
      callerOnError?.(error, variables, onMutateResult, mutationContext);
    },

    onSuccess: (data, variables, onMutateResult, mutationContext) => {
      if (invalidates && invalidates.length > 0) {
        for (const key of invalidates) {
          void queryClient.invalidateQueries({ queryKey: key });
        }
      }
      if (undo) {
        toast.action(undo.message, {
          actionLabel: undo.actionLabel ?? "Deshacer",
          onAction: undo.onUndo,
          duration: undo.duration ?? 6000,
        });
      }
      callerOnSuccess?.(data, variables, onMutateResult as TContext, mutationContext);
    },

    ...mutationOptions,
  });
}
