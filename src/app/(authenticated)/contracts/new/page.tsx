"use client";

import { useRouter } from "next/navigation";
import { ContractWizard } from "@/components/contracts/contract-wizard";

/**
 * `/contracts/new` — wizard de creacion de contrato (F-3.3).
 */
export default function NewContractPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <ContractWizard
        onComplete={(contractId) => {
          router.push(`/contracts?detail=${contractId}`);
        }}
        onCancel={() => {
          router.push("/contracts");
        }}
      />
    </div>
  );
}
