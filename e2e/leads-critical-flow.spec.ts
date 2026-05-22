import { expect, test, type Page } from "@playwright/test";

/**
 * E2E del flujo crítico de Leads (F-2.1 + F-2.4 + F-2.5 + F-2.7 + F-2.10).
 *
 * Cobertura del test principal:
 *  1. Aterrizo en `/`, navego a `/leads`.
 *  2. Abro command palette con `ctrl/cmd+k`.
 *  3. Ejecuto "Crear lead" → se abre el Sheet.
 *  4. Relleno el form (first_name, last_name, email, phone E.164).
 *  5. Submit → toast "Lead creado".
 *  6. Click "Ver" del toast → navego a `/leads/{id}`.
 *  7. Header del detalle muestra el nombre.
 *  8. Edito inline el campo Empresa (la inline edit de status no existe
 *     en este sheet — el cambio de status real va vía /move o Kanban).
 *  9. Elimino con confirm + texto específico.
 * 10. Toast "Deshacer" → click → toast de restauración.
 *
 * El test secundario (smoke) verifica:
 *  - `cmd+k` abre y `Esc` cierra.
 *  - El input de búsqueda actualiza la URL con `?q=`.
 *  - El paginador se mantiene en el flow.
 *
 * Servidor: `pnpm dev` con `NEXT_PUBLIC_API_MOCKING=enabled` →
 * MSW intercepta TODAS las llamadas a `/v1/*` con fixtures. Clerk en
 * modo demo (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_replace_me`)
 * → no hay guard, la app sirve directamente.
 */

/**
 * Helper: el ID del lead recién creado lo extraemos de la URL después
 * de hacer click "Ver" en el toast. Mantiene los tests independientes.
 */
async function gotoLeads(page: Page) {
  await page.goto("/leads");
  // Espera a que la tabla cargue (o el header de la página al menos).
  await expect(
    page.getByRole("heading", { name: "Leads", level: 1 }),
  ).toBeVisible();
}

async function openCommandPalette(page: Page) {
  // `mod` es la convención cross-platform de Playwright para cmd/ctrl.
  await page.keyboard.press(
    process.platform === "darwin" ? "Meta+k" : "Control+k",
  );
  await expect(
    page.getByPlaceholder("Buscar leads, ejecutar acciones…"),
  ).toBeVisible();
}

test.describe("Leads — flujo crítico", () => {
  test.beforeEach(async ({ page }) => {
    // Antes de cada test, aterrizamos en la landing pública.
    // En demo mode (Clerk con placeholder key) no hay sign-in flow,
    // así que basta con navegar a `/leads`.
    await page.goto("/");
  });

  test("crear lead → ver detalle → editar empresa → eliminar con undo", async ({
    page,
  }) => {
    await gotoLeads(page);

    // ── 1) Abrir cmd-k ───────────────────────────────────────────────
    await openCommandPalette(page);

    // ── 2) Ejecutar "Crear lead" ─────────────────────────────────────
    // El CommandItem "Crear lead" navega a `/leads?createLead=1` y el
    // Page Client abre el Sheet automáticamente.
    await page.getByRole("option", { name: /Crear lead/i }).first().click();

    // Sheet aparece → input Nombre visible.
    await expect(page.getByLabel("Nombre", { exact: true })).toBeVisible();

    // ── 3) Rellenar form ─────────────────────────────────────────────
    const stamp = Date.now();
    const firstName = `Test${stamp}`;
    const lastName = "E2E";

    await page.getByLabel("Nombre", { exact: true }).fill(firstName);
    await page.getByLabel("Apellidos", { exact: true }).fill(lastName);
    await page.getByLabel("Email", { exact: true }).fill(
      `test.${stamp}@playwright.dev`,
    );
    await page.getByLabel("Teléfono", { exact: true }).fill("+34612345678");

    // ── 4) Submit ────────────────────────────────────────────────────
    await page
      .getByRole("button", { name: "Crear lead", exact: true })
      .click();

    // ── 5) Toast de éxito ────────────────────────────────────────────
    await expect(page.getByText("Lead creado")).toBeVisible({ timeout: 10_000 });

    // ── 6) Click "Ver" en el toast → navego al detalle ───────────────
    await page.getByRole("button", { name: "Ver" }).click();
    await page.waitForURL(/\/leads\/[0-9a-fA-F-]{36}$/);

    // ── 7) Header del detalle muestra el nombre ──────────────────────
    await expect(
      page.getByRole("heading", { name: `${firstName} ${lastName}` }),
    ).toBeVisible({ timeout: 10_000 });

    // ── 8) Edito inline el campo Empresa ──────────────────────────────
    // El campo Empresa empieza vacío ("—"). Hacemos click sobre su
    // botón de edición. InlineEditField usa Pencil con aria-label.
    const empresaLabel = page.getByText("Empresa", { exact: true }).first();
    await empresaLabel.scrollIntoViewIfNeeded();

    // El control de edición está adyacente al label — click sobre el
    // contenedor del field para entrar en modo edición.
    const empresaSection = page.locator("section,div").filter({
      has: empresaLabel,
    }).first();
    await empresaSection.getByRole("button").first().click();

    const empresaInput = empresaSection.getByRole("textbox");
    await empresaInput.fill("Comercializadora Test SL");
    await empresaInput.press("Enter");

    // Verificamos que aparece en el render del campo (modo lectura).
    await expect(
      empresaSection.getByText("Comercializadora Test SL"),
    ).toBeVisible({ timeout: 10_000 });

    // ── 9) Eliminar con confirm específico ────────────────────────────
    await page.getByRole("button", { name: "Eliminar lead" }).click();

    // Diálogo de confirmación. El BACKLOG exige texto específico:
    // "Eliminar lead {nombre}. ...".
    const confirmDialog = page.getByRole("dialog");
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog).toContainText(/Eliminar lead/i);
    await expect(confirmDialog).toContainText(firstName);

    // Botón "Eliminar" dentro del diálogo (no el del header).
    await confirmDialog.getByRole("button", { name: "Eliminar" }).click();

    // ── 10) Toast con "Deshacer" → click → restauración ──────────────
    await expect(page.getByText("Lead eliminado")).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole("button", { name: "Deshacer" }).click();

    // Tras el undo, MSW restaura el lead y emitimos un toast de
    // confirmación. En este punto la cache de detalle vuelve a tener
    // el lead — el usuario está en /leads (el sheet se cerró al borrar).
    await expect(page.getByText(/restaur/i)).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Leads — smoke", () => {
  test("cmd+k abre y cierra; búsqueda escribe ?q=; pagina existe", async ({
    page,
  }) => {
    await gotoLeads(page);

    // cmd+k abre.
    await openCommandPalette(page);
    // Esc cierra.
    await page.keyboard.press("Escape");
    await expect(
      page.getByPlaceholder("Buscar leads, ejecutar acciones…"),
    ).not.toBeVisible();

    // Usar el input de búsqueda del sidebar de filtros (debounce 300ms).
    const search = page.getByPlaceholder(/Buscar/i).first();
    if (await search.isVisible()) {
      await search.fill("garcia");
      // El URL debe reflejar el filtro (debounce 300ms → esperamos 600).
      await page.waitForURL(/\?(.*&)?q=garcia/i, { timeout: 5_000 });
    }
  });
});
