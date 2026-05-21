import { CardSkeleton } from "@/components/skeletons/card-skeleton";

/**
 * Loading state que cubre todo el árbol autenticado durante navegación entre
 * rutas (Next App Router consume `loading.tsx` automáticamente al disparar
 * Suspense en navigation transitions).
 *
 * El chrome (sidebar + topbar) ya está montado en `(authenticated)/layout.tsx`
 * — este componente solo cubre el `<main>`.
 */
export default function AuthenticatedLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div
          aria-hidden
          className="h-7 w-48 animate-pulse rounded-md bg-muted"
        />
        <div
          aria-hidden
          className="h-4 w-72 animate-pulse rounded-md bg-muted"
        />
      </div>
      <CardSkeleton count={3} />
    </div>
  );
}
