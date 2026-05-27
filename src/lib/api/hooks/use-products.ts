"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import {
  ProductPageSchema,
  ProductSchema,
  type Product,
  type ProductCreate,
  type ProductPage,
  type ProductUpdate,
} from "../zod-schemas";
import { useApiQuery } from "./use-api-query";
import { useApiMutation } from "./use-api-mutation";

/**
 * Hooks tipados para el recurso Product (Sprint 3).
 *
 * Endpoints:
 *  - GET /v1/products (catálogo paginado)
 *  - GET /v1/products/{product_id} (detalle)
 *  - POST /v1/products (crear)
 *  - PATCH /v1/products/{product_id} (actualizar)
 *  - DELETE /v1/products/{product_id} (eliminar)
 */

export interface UseProductsParams {
  q?: string;
  status?: string;
  energy_type?: string;
  limit?: number;
  offset?: number;
}

export const productsQueryKeys = {
  all: ["/v1/products"] as const,
  list: (params: UseProductsParams = {}) => ["/v1/products", params] as const,
  detail: (productId: string) => ["/v1/products", productId] as const,
};

/** Lista paginada de productos del tenant. */
export function useProducts(
  params: UseProductsParams = {},
): UseQueryResult<ProductPage, Error> {
  return useApiQuery("/v1/products", {
    query: params as unknown as Record<string, string | number | boolean | undefined>,
    schema: ProductPageSchema,
  });
}

/** Detalle de un producto. */
export function useProduct(
  productId: string | undefined,
): UseQueryResult<Product, Error> {
  return useApiQuery("/v1/products/{product_id}", {
    pathParams: productId ? { product_id: productId } : undefined,
    schema: ProductSchema,
    enabled: Boolean(productId),
  });
}

/** Crear producto. */
export function useCreateProduct() {
  return useApiMutation<"/v1/products", "post", typeof ProductSchema>(
    "/v1/products",
    {
      method: "POST",
      idempotencyKey: "auto",
      schema: ProductSchema,
      invalidates: [productsQueryKeys.all],
    },
  );
}

/** Actualizar producto. */
export function useUpdateProduct(productId: string) {
  return useApiMutation<"/v1/products/{product_id}", "patch", typeof ProductSchema>(
    "/v1/products/{product_id}",
    {
      method: "PATCH",
      pathParams: { product_id: productId },
      idempotencyKey: "auto",
      schema: ProductSchema,
      invalidates: [
        productsQueryKeys.all,
        productsQueryKeys.detail(productId),
      ],
    },
  );
}

/** Eliminar producto. */
export function useDeleteProduct(productId: string) {
  return useApiMutation<"/v1/products/{product_id}", "delete">(
    "/v1/products/{product_id}",
    {
      method: "DELETE",
      pathParams: { product_id: productId },
      invalidates: [
        productsQueryKeys.all,
        productsQueryKeys.detail(productId),
      ],
    },
  );
}

// Re-exports
export type {
  Product,
  ProductCreate,
  ProductPage,
  ProductUpdate,
};
