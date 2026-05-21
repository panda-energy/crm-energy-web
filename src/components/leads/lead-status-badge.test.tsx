import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeadStatusBadge } from "./lead-status-badge";

describe("LeadStatusBadge", () => {
  it("renderiza el label en castellano y la variante por status", () => {
    const cases = [
      { status: "new", label: "Nuevo" },
      { status: "contacted", label: "Contactado" },
      { status: "qualified", label: "Cualificado" },
      { status: "won", label: "Ganado" },
      { status: "lost", label: "Perdido" },
    ] as const;
    for (const { status, label } of cases) {
      const { unmount } = render(<LeadStatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });
});
