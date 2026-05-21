import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { CardSkeleton } from "@/components/skeletons/card-skeleton";

describe("EmptyState", () => {
  it("renderiza title + description + action y anuncia role=status", () => {
    render(
      <EmptyState
        title="Aún no hay leads"
        description="Crea el primero para empezar."
        action={<button type="button">Crear lead</button>}
      />,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Aún no hay leads")).toBeInTheDocument();
    expect(screen.getByText("Crea el primero para empezar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear lead" })).toBeInTheDocument();
  });

  it("funciona sin description ni action", () => {
    render(<EmptyState title="Vacío" />);
    expect(screen.getByText("Vacío")).toBeInTheDocument();
  });
});

describe("TableSkeleton", () => {
  it("renderiza por defecto 6 filas × 4 columnas", () => {
    const { container } = render(<TableSkeleton />);
    // 1 fila header + 6 filas body = 7 grids (querySelectorAll captura todos)
    const grids = container.querySelectorAll('[style*="grid-template-columns"]');
    expect(grids.length).toBe(1 + 6);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });

  it("respeta props rows y cols", () => {
    const { container } = render(<TableSkeleton rows={3} cols={2} />);
    const grids = container.querySelectorAll('[style*="grid-template-columns"]');
    // 1 header + 3 body = 4
    expect(grids.length).toBe(4);
    // Cada grid debe tener 2 columnas → 2 skeletons.
    const firstGrid = grids[0];
    if (!firstGrid) throw new Error("missing grid");
    expect(firstGrid.children.length).toBe(2);
  });

  it("anuncia ariaLabel personalizado a SR", () => {
    render(<TableSkeleton ariaLabel="Cargando leads…" />);
    expect(screen.getByText("Cargando leads…")).toHaveClass("sr-only");
  });
});

describe("CardSkeleton", () => {
  it("count=1 renderiza un solo article", () => {
    const { container } = render(<CardSkeleton />);
    expect(container.querySelectorAll("article")).toHaveLength(1);
  });

  it("count>1 renderiza grid de N articles", () => {
    const { container } = render(<CardSkeleton count={3} />);
    expect(container.querySelectorAll("article")).toHaveLength(3);
  });
});
