import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { MswStatusBadge } from "@/mocks/MswProvider";

/**
 * Smoke del badge sutil que aparece mientras MSW arranca o si falla.
 * El render del shell de la app NO se bloquea por MSW (cambio del
 * 2026-05-22 — el splash bloqueante causaba pantallas en blanco si
 * el worker fallaba al arrancar).
 */
describe("MswStatusBadge", () => {
  it("muestra mensaje de carga mientras arranca", () => {
    render(<MswStatusBadge status="starting" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Cargando datos demo…")).toBeInTheDocument();
  });

  it("muestra mensaje de error si MSW falló", () => {
    render(<MswStatusBadge status="error" />);
    expect(screen.getByText(/MSW no arrancó/)).toBeInTheDocument();
    expect(screen.getByRole("status").className).toContain("text-danger");
  });

  it("no captura clicks (pointer-events-none)", () => {
    render(<MswStatusBadge status="starting" />);
    expect(screen.getByRole("status").className).toContain("pointer-events-none");
  });
});
