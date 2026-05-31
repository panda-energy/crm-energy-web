"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CustomerConsumption,
  CustomerInvoice,
  InvoicePage,
  InvoiceStatus,
  PowerModificationRequest,
  PowerModificationCreate,
} from "../types-sprint5";
import {
  CustomerConsumptionSchema,
  InvoicePageSchema,
  PowerModificationRequestSchema,
} from "../zod-schemas-sprint5";
import { z } from "zod";
import { apiGet, apiPost, type ApiRequestOptions } from "../client";
import { useClerkApiContext } from "./clerk-context";
import { toast } from "@/lib/ui/toast";

/**
 * Hooks tipados para el Portal Cliente (Sprint 5).
 *
 * Endpoints (anticipados):
 *  - GET /v1/portal/consumption
 *  - GET /v1/portal/invoices
 *  - GET /v1/portal/invoices/{id}/pdf
 *  - GET /v1/portal/power-requests
 *  - POST /v1/portal/power-requests
 */

export interface UsePortalInvoicesParams {
  year?: number;
  status?: InvoiceStatus;
  limit?: number;
  offset?: number;
}

export const portalQueryKeys = {
  consumption: ["/v1/portal/consumption"] as const,
  invoices: ["/v1/portal/invoices"] as const,
  invoicesList: (params: UsePortalInvoicesParams = {}) =>
    ["/v1/portal/invoices", params] as const,
  powerRequests: ["/v1/portal/power-requests"] as const,
};

/** Datos de consumo del cliente (12 meses). */
export function useCustomerConsumption(year?: number) {
  const { getToken, tenantId } = useClerkApiContext();

  return useQuery<CustomerConsumption[], Error>({
    queryKey: ["/v1/portal/consumption", tenantId, year],
    queryFn: async ({ signal }) => {
      const query: Record<string, string | number | boolean | undefined> = {};
      if (year) query.year = year;
      const opts: ApiRequestOptions = { getToken, tenantId, signal, query };
      const data = await apiGet<unknown>("/v1/portal/consumption", opts);
      return z.array(CustomerConsumptionSchema).parse(data);
    },
  });
}

/** Lista paginada de facturas del cliente. */
export function useCustomerInvoices(params: UsePortalInvoicesParams = {}) {
  const { getToken, tenantId } = useClerkApiContext();

  return useQuery<InvoicePage, Error>({
    queryKey: ["/v1/portal/invoices", tenantId, params],
    queryFn: async ({ signal }) => {
      const query: Record<string, string | number | boolean | undefined> = {};
      if (params.limit) query.limit = params.limit;
      if (params.offset) query.offset = params.offset;
      if (params.year) query.year = params.year;
      if (params.status) query.status = params.status;

      const opts: ApiRequestOptions = { getToken, tenantId, signal, query };
      const data = await apiGet<unknown>("/v1/portal/invoices", opts);
      return InvoicePageSchema.parse(data);
    },
    placeholderData: (prev) => prev,
  });
}

/**
 * Descarga el PDF de una factura con autenticacion.
 * No se puede usar <a href> porque el backend requiere Bearer token.
 */
export async function downloadInvoicePdf(
  invoiceId: string,
  getToken: () => Promise<string | null>,
): Promise<void> {
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const url = `${base}/v1/portal/invoices/${encodeURIComponent(invoiceId)}/pdf`;
  const token = await getToken();
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Error al descargar PDF");
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `factura-${invoiceId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

/** Lista de solicitudes de modificacion de potencia. */
export function usePowerModificationRequests() {
  const { getToken, tenantId } = useClerkApiContext();

  return useQuery<PowerModificationRequest[], Error>({
    queryKey: ["/v1/portal/power-requests", tenantId],
    queryFn: async ({ signal }) => {
      const opts: ApiRequestOptions = { getToken, tenantId, signal };
      const data = await apiGet<unknown>("/v1/portal/power-requests", opts);
      return z.array(PowerModificationRequestSchema).parse(data);
    },
  });
}

/** Crear solicitud de modificacion de potencia. */
export function useCreatePowerModification() {
  const { getToken, tenantId } = useClerkApiContext();
  const queryClient = useQueryClient();

  return useMutation<PowerModificationRequest, Error, PowerModificationCreate>({
    mutationFn: async (body) => {
      const opts: ApiRequestOptions = {
        getToken,
        tenantId,
        idempotencyKey: "auto",
      };
      const data = await apiPost<unknown>(
        "/v1/portal/power-requests",
        body,
        opts,
      );
      return PowerModificationRequestSchema.parse(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: portalQueryKeys.powerRequests,
      });
      toast.success("Solicitud de modificacion de potencia enviada");
    },
    onError: (error) => {
      toast.error(
        `Error al solicitar modificacion de potencia: ${error.message}`,
      );
    },
  });
}

// Re-exports
export type {
  CustomerConsumption,
  CustomerInvoice,
  InvoicePage,
  PowerModificationRequest,
  PowerModificationCreate,
};
