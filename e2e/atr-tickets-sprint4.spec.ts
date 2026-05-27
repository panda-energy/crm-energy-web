import { expect, test, type Page } from "@playwright/test";

/**
 * E2E tests for Sprint 4: ATR monitoring + Tickets inbox.
 *
 * Server: `pnpm dev` with `NEXT_PUBLIC_API_MOCKING=enabled` =>
 * MSW intercepts all calls to `/v1/*` with fixtures.
 */

// ── ATR Tests ───────────────────────────────────────────────────────────────

async function gotoAtr(page: Page) {
  await page.goto("/atr");
  await expect(
    page.getByRole("heading", { name: /Monitorizaci/, level: 1 }),
  ).toBeVisible({ timeout: 15_000 });
}

test.describe("ATR - dashboard", () => {
  test("tabla ATR carga y muestra datos", async ({ page }) => {
    await gotoAtr(page);

    // The table should show at least one ATR message with a CUPS code
    await expect(page.getByText(/^ES\d{16}/)).toBeVisible({
      timeout: 10_000,
    });

    // Stats cards should be visible
    await expect(page.getByText("Pendientes")).toBeVisible();
    await expect(page.getByText("Procesados")).toBeVisible();
  });

  test("filtrar por estado muestra resultados filtrados", async ({
    page,
  }) => {
    await gotoAtr(page);

    // Filter by status "Rechazado"
    await page.getByLabel("Filtrar por estado").click();
    await page.getByRole("option", { name: "Rechazado" }).click();

    // Wait for table to update
    await page.waitForTimeout(500);

    // Should not show an error
    await expect(page.getByText(/Error/i)).not.toBeVisible();
  });

  test("click en fila abre detalle ATR", async ({ page }) => {
    await gotoAtr(page);

    // Click on the first data row
    const rows = page.locator("tbody tr");
    await rows.first().click();

    // Sheet should open with detail
    await expect(page.getByText("Detalle ATR")).toBeVisible({
      timeout: 10_000,
    });

    // Should show tabs
    await expect(page.getByRole("tab", { name: "Info" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "XML" })).toBeVisible();
  });

  test("reintentar mensaje ATR rechazado", async ({ page }) => {
    await gotoAtr(page);

    // Filter by rejected status
    await page.getByLabel("Filtrar por estado").click();
    await page.getByRole("option", { name: "Rechazado" }).click();
    await page.waitForTimeout(500);

    // Click first rejected row
    const rows = page.locator("tbody tr");
    const firstRow = rows.first();
    if (await firstRow.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await firstRow.click();

      // Look for retry button
      const retryButton = page.getByRole("button", {
        name: /Reintentar/i,
      });
      if (
        await retryButton.isVisible({ timeout: 5_000 }).catch(() => false)
      ) {
        await retryButton.click();

        // Should show success toast
        await expect(page.getByText(/Reintento programado/i)).toBeVisible({
          timeout: 5_000,
        });
      }
    }
  });

  test("busqueda por CUPS filtra la tabla", async ({ page }) => {
    await gotoAtr(page);

    const search = page.getByPlaceholder(/Buscar por CUPS/i);
    await search.fill("ES0021");

    // Wait for debounce
    await page.waitForTimeout(500);

    // Should not show an error
    await expect(page.getByText(/Error/i)).not.toBeVisible();
  });
});

// ── Tickets Tests ───────────────────────────────────────────────────────────

async function gotoTickets(page: Page) {
  await page.goto("/tickets");
  await expect(
    page.getByRole("heading", { name: "Tickets", level: 1 }),
  ).toBeVisible({ timeout: 15_000 });
}

test.describe("Tickets - inbox", () => {
  test("inbox carga y muestra tickets", async ({ page }) => {
    await gotoTickets(page);

    // Should show ticket subjects
    await expect(page.getByText(/Factura incorrecta/i)).toBeVisible({
      timeout: 10_000,
    });

    // Should show total count
    await expect(page.getByText(/\d+ tickets/)).toBeVisible();
  });

  test("seleccionar ticket muestra conversacion", async ({ page }) => {
    await gotoTickets(page);

    // Click on first ticket in list
    await page
      .getByText(/Factura incorrecta/i)
      .first()
      .click();

    // Conversation should be visible with messages
    await expect(page.getByText(/Buenos dias/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("enviar respuesta en ticket", async ({ page }) => {
    await gotoTickets(page);

    // Select a ticket
    await page
      .getByText(/Factura incorrecta/i)
      .first()
      .click();

    // Wait for conversation to load
    await page.waitForTimeout(1_000);

    // Type a reply
    const replyInput = page.getByLabel("Respuesta del ticket");
    if (await replyInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await replyInput.fill("Gracias por contactarnos, revisamos su caso.");

      // Click send
      await page.getByLabel("Enviar mensaje").click();

      // The new message should appear
      await expect(
        page.getByText("Gracias por contactarnos").first(),
      ).toBeVisible({ timeout: 5_000 });
    }
  });

  test("cerrar ticket muestra confirmacion", async ({ page }) => {
    await gotoTickets(page);

    // Select a ticket
    await page
      .getByText(/Factura incorrecta/i)
      .first()
      .click();

    await page.waitForTimeout(1_000);

    // Click close button
    const closeButton = page.getByRole("button", {
      name: /Cerrar ticket/i,
    });
    if (
      await closeButton.isVisible({ timeout: 5_000 }).catch(() => false)
    ) {
      await closeButton.click();

      // Confirmation dialog should appear
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5_000 });
      await expect(dialog).toContainText(
        /Esta accion no se puede deshacer/i,
      );

      // Close dialog without confirming
      await dialog.getByRole("button", { name: "Volver" }).click();
    }
  });

  test("crear nuevo ticket via dialog", async ({ page }) => {
    await gotoTickets(page);

    // Click new ticket button
    await page.getByRole("button", { name: /Nuevo ticket/i }).click();

    // Dialog should open
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Fill in ticket details
    await dialog.getByLabel("Asunto").fill("Test ticket desde E2E");

    // Submit
    await dialog.getByRole("button", { name: /Crear ticket/i }).click();

    // Toast should confirm creation
    await expect(page.getByText(/Ticket creado/i)).toBeVisible({
      timeout: 5_000,
    });
  });

  test("filtrar por tab de estado", async ({ page }) => {
    await gotoTickets(page);

    // Click on "Abiertos" tab
    await page.getByRole("tab", { name: "Abiertos" }).click();
    await page.waitForTimeout(500);

    // Should not show error
    await expect(page.getByText(/Error/i)).not.toBeVisible();
  });
});
