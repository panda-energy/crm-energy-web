import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 404 dentro del CRM autenticado. Mantiene sidebar/topbar gracias al layout
 * que envuelve. Para 404 fuera de `(authenticated)` Next usa su default.
 */
export default function AuthenticatedNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-md space-y-6 text-center">
        <div
          aria-hidden
          className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <Compass className="size-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">
            Esta vista no existe
          </h1>
          <p className="text-sm text-muted-foreground">
            Comprueba la URL o vuelve al panel.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard">Ir al panel</Link>
        </Button>
      </div>
    </div>
  );
}
