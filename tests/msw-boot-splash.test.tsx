import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { MswBootSplash } from "@/mocks/MswProvider";

/**
 * Smoke + snapshot del splash que se muestra mientras MSW arranca.
 * Verifica:
 *  - presencia del wordmark y subtexto.
 *  - role="status" + aria-live="polite" (lectores de pantalla).
 *  - clases responsivas a dark mode (bg-background + text-foreground —
 *    Tailwind resuelve la paleta correcta vía data-theme/.dark).
 */
describe("MswBootSplash", () => {
  it("muestra wordmark, subtexto y spinner accesible", () => {
    render(<MswBootSplash />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Panda Energy")).toHaveClass("text-brand");
    expect(screen.getByText("Cargando modo demo…")).toBeInTheDocument();
    // sr-only para screen readers.
    expect(
      screen.getByText("Cargando aplicación, por favor espere."),
    ).toHaveClass("sr-only");
  });

  it("snapshot estructural — sirve como guard contra regresiones visuales", () => {
    const { container } = render(<MswBootSplash />);
    // reason: snapshot estructural mínimo. La paleta dark/light se resuelve
    // en runtime vía clases Tailwind (`bg-background`); validamos que esas
    // clases existen, no que el color computado coincide.
    const root = container.querySelector('[data-testid="msw-boot-splash"]');
    expect(root).not.toBeNull();
    expect(root?.className).toContain("bg-background");
    expect(root?.className).toContain("text-foreground");
    expect(root?.className).toContain("min-h-screen");
  });
});
