"use client";

import { keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import {
  useContracts,
  contractsQueryKeys,
  useCancelContract,
  useSignContract,
} from "@/lib/api/hooks/use-contracts";
import { toast } from "@/lib/ui/toast";
import { ContractsTable } from "./contracts-table";
import { ContractDetailSheet } from "./contract-detail-sheet";
import { SignContractDialog } from "./sign-contract-dialog";

/**
 * Client component for /contracts page (F-3.6).
 */

const DEFAULT_LIMIT = 25;

export function ContractsPageClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [signContractId, setSignContractId] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<{
    id: string;
    number: string;
  } | null>(null);

  const searchTimeout = useMemo(
    () => ({ current: null as ReturnType<typeof setTimeout> | null }),
    [],
  );
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        setDebouncedSearch(value);
        setOffset(0);
      }, 300);
    },
    [searchTimeout],
  );

  const contractsQuery = useContracts({
    q: debouncedSearch || undefined,
    limit: DEFAULT_LIMIT,
    offset,
  });

  useMemo(() => {
    queryClient.setQueryDefaults(contractsQueryKeys.all, {
      placeholderData: keepPreviousData,
      staleTime: 30_000,
    });
  }, [queryClient]);

  const items = useMemo(
    () => contractsQuery.data?.items ?? [],
    [contractsQuery.data],
  );
  const total = contractsQuery.data?.total ?? 0;

  const handleSign = useCallback(
    (contractId: string) => {
      setSignContractId(contractId);
    },
    [],
  );

  const handleCancel = useCallback(
    (contractId: string) => {
      const contract = items.find((c) => c.id === contractId);
      if (contract) {
        setCancelConfirm({ id: contractId, number: contract.number });
      }
    },
    [items],
  );

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-6 md:px-8 md:py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Contratos
          </h1>
          <p className="text-sm text-muted-foreground">
            {contractsQuery.isLoading
              ? "Cargando..."
              : `${total.toLocaleString("es-ES")} ${total === 1 ? "contrato" : "contratos"}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden />
            <Input
              placeholder="Buscar por numero, cliente..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-64 pl-9"
              aria-label="Buscar contratos"
            />
          </div>
          <Button onClick={() => router.push("/contracts/new")}>
            <Plus className="size-4" aria-hidden />
            Nuevo contrato
          </Button>
        </div>
      </header>

      {contractsQuery.isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : contractsQuery.isError ? (
        <EmptyState
          icon={<FileText />}
          title="No pudimos cargar los contratos"
          description={contractsQuery.error?.message ?? "Error al conectar."}
          action={
            <Button onClick={() => contractsQuery.refetch()}>Reintentar</Button>
          }
        />
      ) : total === 0 && debouncedSearch ? (
        <EmptyState
          icon={<FileText />}
          title="Sin resultados"
          description={`No hay contratos que coincidan con "${debouncedSearch}".`}
          action={
            <Button variant="outline" onClick={() => handleSearchChange("")}>
              Limpiar búsqueda
            </Button>
          }
        />
      ) : total === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="Aún no tienes contratos"
          description="Crea el primero con el wizard de contratación."
          action={
            <Button onClick={() => router.push("/contracts/new")}>
              <Plus className="size-4" aria-hidden />
              Crear primer contrato
            </Button>
          }
        />
      ) : (
        <>
          <ContractsTable
            data={items}
            onSelect={setSelectedContractId}
            onSign={handleSign}
            onCancel={handleCancel}
            isRefetching={contractsQuery.isFetching && !contractsQuery.isLoading}
          />
          {total > DEFAULT_LIMIT && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {offset + 1}–{Math.min(offset + DEFAULT_LIMIT, total)} de{" "}
                {total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - DEFAULT_LIMIT))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset + DEFAULT_LIMIT >= total}
                  onClick={() => setOffset(offset + DEFAULT_LIMIT)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail sheet */}
      {selectedContractId && (
        <ContractDetailSheet
          contractId={selectedContractId}
          onClose={() => setSelectedContractId(null)}
          onSign={handleSign}
        />
      )}

      {/* Sign dialog */}
      {signContractId && (
        <SignContractDialog
          contractId={signContractId}
          onClose={() => setSignContractId(null)}
        />
      )}

      {/* Cancel confirmation */}
      {cancelConfirm && (
        <CancelConfirmDialog
          contractId={cancelConfirm.id}
          contractNumber={cancelConfirm.number}
          onClose={() => setCancelConfirm(null)}
        />
      )}
    </div>
  );
}

/** Destructive confirmation dialog for cancel. */
function CancelConfirmDialog({
  contractId,
  contractNumber,
  onClose,
}: {
  contractId: string;
  contractNumber: string;
  onClose: () => void;
}) {
  const cancelContract = useCancelContract(contractId);

  const handleConfirm = async () => {
    try {
      await cancelContract.mutateAsync({ reason: "Cancelado por el usuario" });
      toast.success(`Contrato ${contractNumber} cancelado`);
      onClose();
    } catch (err) {
      toast.error("Error al cancelar contrato", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar contrato</DialogTitle>
          <DialogDescription>
            Cancelar contrato {contractNumber}. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Volver
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={cancelContract.isPending}
          >
            Cancelar contrato
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
