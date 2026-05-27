import { expect, test, type Page } from "@playwright/test";

/**
 * E2E tests for Sprint 5: AI Chat + Commissions + Portal Cliente.
 *
 * Server: `pnpm dev` with `NEXT_PUBLIC_API_MOCKING=enabled` =>
 * MSW intercepts all calls to `/v1/*` with fixtures.
 */

// ── AI Chat Tests ──────────────────────────────────────────────────────────

test.describe("AI Chat panel", () => {
  test("abrir AI Chat con boton y enviar mensaje", async ({ page }) => {
    await page.goto("/leads");
    await expect(
      page.getByRole("heading", { name: "Leads" }),
    ).toBeVisible({ timeout: 15_000 });

    // Click AI chat trigger button
    await page.getByLabel(/Asistente Panda AI/).click();

    // Panel should open
    await expect(
      page.getByRole("complementary", { name: "Asistente Panda AI" }),
    ).toBeVisible({ timeout: 5_000 });

    // Should show chat header
    await expect(page.getByText("Panda AI")).toBeVisible();

    // Type and send a message
    const input = page.getByLabel("Mensaje para Panda AI");
    await input.fill("Cuantos leads tenemos?");
    await page.getByLabel("Enviar mensaje").click();

    // Should show assistant response (with markdown)
    await expect(
      page.getByText(/leads activos|analizado/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("cerrar panel AI Chat con boton X", async ({ page }) => {
    await page.goto("/leads");
    await expect(
      page.getByRole("heading", { name: "Leads" }),
    ).toBeVisible({ timeout: 15_000 });

    // Open
    await page.getByLabel(/Asistente Panda AI/).click();
    await expect(
      page.getByRole("complementary", { name: "Asistente Panda AI" }),
    ).toBeVisible({ timeout: 5_000 });

    // Close
    await page.getByLabel("Cerrar asistente AI").click();

    // Panel should be hidden
    await expect(
      page.getByRole("complementary", { name: "Asistente Panda AI" }),
    ).toBeHidden();
  });

  test("ver tool call pendiente en respuesta del chat", async ({ page }) => {
    await page.goto("/leads");
    await expect(
      page.getByRole("heading", { name: "Leads" }),
    ).toBeVisible({ timeout: 15_000 });

    // Open chat
    await page.getByLabel(/Asistente Panda AI/).click();
    await expect(page.getByText("Panda AI")).toBeVisible({ timeout: 5_000 });

    // Send message that triggers tool call
    const input = page.getByLabel("Mensaje para Panda AI");
    await input.fill("Crea un lead nuevo para testing");
    await page.getByLabel("Enviar mensaje").click();

    // Should show tool call card with approve/reject buttons
    await expect(
      page.getByText(/Aprobar/).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ── Commissions Tests ──────────────────────────────────────────────────────

async function gotoCommissions(page: Page) {
  await page.goto("/commissions");
  await expect(
    page.getByRole("heading", { name: "Comisiones", level: 1 }),
  ).toBeVisible({ timeout: 15_000 });
}

test.describe("Commissions page", () => {
  test("ver tab Canales con jerarquia", async ({ page }) => {
    await gotoCommissions(page);

    // Should show channels tab by default
    await expect(page.getByText("Venta Directa")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Agencia Madrid")).toBeVisible();
  });

  test("cambiar a tab Liquidaciones", async ({ page }) => {
    await gotoCommissions(page);

    await page.getByRole("tab", { name: "Liquidaciones" }).click();

    // Should show commissions table
    await expect(page.getByText("Periodo")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Importe")).toBeVisible();
  });

  test("ver tab Mi Dashboard con resumen", async ({ page }) => {
    await gotoCommissions(page);

    await page.getByRole("tab", { name: "Mi Dashboard" }).click();

    // Should show summary cards
    await expect(page.getByText("Pendiente")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Aprobado")).toBeVisible();
    await expect(page.getByText("Pagado")).toBeVisible();

    // Should show target progress
    await expect(page.getByText("Objetivo mensual")).toBeVisible();
  });
});

// ── Portal Tests ───────────────────────────────────────────────────────────

test.describe("Portal Cliente", () => {
  test("landing page muestra cards de navegacion", async ({ page }) => {
    await page.goto("/portal");
    await expect(
      page.getByText("Bienvenido a tu portal de energia"),
    ).toBeVisible({ timeout: 15_000 });

    await expect(page.getByText("Mi consumo")).toBeVisible();
    await expect(page.getByText("Mis facturas")).toBeVisible();
    await expect(page.getByText("Modificar potencia")).toBeVisible();
  });

  test("vista consumo muestra grafico y tabla", async ({ page }) => {
    await page.goto("/portal/consumption");
    await expect(
      page.getByRole("heading", { name: "Mi consumo" }),
    ).toBeVisible({ timeout: 15_000 });

    // Should show consumption data
    await expect(page.getByText("Consumo mensual")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Detalle por mes")).toBeVisible();

    // Should show at least one period in table
    await expect(page.getByText("2026-05")).toBeVisible();
  });

  test("facturas muestra tabla con estados", async ({ page }) => {
    await page.goto("/portal/invoices");
    await expect(
      page.getByRole("heading", { name: "Mis facturas" }),
    ).toBeVisible({ timeout: 15_000 });

    // Should show invoice numbers
    await expect(page.getByText("FAC-2026-0001").first()).toBeVisible({
      timeout: 10_000,
    });

    // Should show overdue badge
    await expect(page.getByText("Vencida").first()).toBeVisible();
  });

  test("modificar potencia muestra formulario y solicitudes", async ({
    page,
  }) => {
    await page.goto("/portal/power");
    await expect(
      page.getByRole("heading", { name: "Modificar potencia" }),
    ).toBeVisible({ timeout: 15_000 });

    // Should show the form
    await expect(
      page.getByText("Solicitar modificacion de potencia"),
    ).toBeVisible({ timeout: 10_000 });

    // Should show current power values
    await expect(page.getByText("Potencias actuales")).toBeVisible();

    // Should show previous requests
    await expect(page.getByText("Solicitudes anteriores")).toBeVisible();
    await expect(page.getByText("ES0021").first()).toBeVisible();

    // Try submitting with new values
    const p1 = page.getByLabel("P1 (kW)");
    const p2 = page.getByLabel("P2 (kW)");

    if (
      (await p1.isVisible({ timeout: 5_000 }).catch(() => false)) &&
      (await p2.isVisible({ timeout: 5_000 }).catch(() => false))
    ) {
      await p1.fill("6.9");
      await p2.fill("6.9");
      await page.getByRole("button", { name: "Enviar solicitud" }).click();

      // Should show success toast
      await expect(
        page.getByText(/Solicitud de modificacion/).first(),
      ).toBeVisible({ timeout: 5_000 });
    }
  });
});
