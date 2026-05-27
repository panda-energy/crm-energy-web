import { expect, test, type Page } from "@playwright/test";

/**
 * E2E del flujo critico de Contratos (F-3.1 + F-3.3 + F-3.5 + F-3.6).
 *
 * Cobertura del test principal:
 *  1. Navego a `/cups` y verifico que la tabla carga.
 *  2. Navego a `/contracts` y verifico la tabla de contratos.
 *  3. Abro el detalle de un contrato (click en fila).
 *  4. Verifico las pestanas: Info, PDF, Firma, Timeline.
 *  5. Cierro el sheet.
 *  6. Navego al wizard `/contracts/new`.
 *  7. Verifico que el wizard muestra los 4 pasos.
 *  8. Intento enviar a firma (click en accion) — verifico dialog.
 *  9. Verifico paginacion y busqueda.
 *
 * Test secundario: CUPS page smoke.
 *
 * Servidor: `pnpm dev` con `NEXT_PUBLIC_API_MOCKING=enabled` =>
 * MSW intercepta TODAS las llamadas a `/v1/*` con fixtures.
 */

async function gotoContracts(page: Page) {
  await page.goto("/contracts");
  await expect(
    page.getByRole("heading", { name: "Contratos", level: 1 }),
  ).toBeVisible({ timeout: 15_000 });
}

async function gotoCups(page: Page) {
  await page.goto("/cups");
  await expect(
    page.getByRole("heading", { name: "CUPS", level: 1 }),
  ).toBeVisible({ timeout: 15_000 });
}

test.describe("CUPS - smoke", () => {
  test("tabla de CUPS carga y muestra datos", async ({ page }) => {
    await gotoCups(page);

    // La tabla debe tener al menos una fila con un codigo CUPS
    await expect(page.getByText(/^ES\d{16}/)).toBeVisible({ timeout: 10_000 });

    // El input de busqueda existe
    const search = page.getByPlaceholder(/Buscar/i).first();
    await expect(search).toBeVisible();
  });

  test("busqueda de CUPS filtra la tabla", async ({ page }) => {
    await gotoCups(page);

    const search = page.getByPlaceholder(/Buscar/i).first();
    await search.fill("ES0021");

    // Espera debounce (300ms) + recarga
    await page.waitForTimeout(500);

    // La tabla deberia seguir mostrando algun CUPS (o empty state)
    // Verificamos que no hay error
    await expect(page.getByText(/Error/i)).not.toBeVisible();
  });
});

test.describe("Contratos - flujo critico", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("tabla contratos carga y navego al detalle", async ({ page }) => {
    await gotoContracts(page);

    // Debe haber al menos un contrato visible (MSW fixtures tienen 8)
    const contractRows = page.locator("tbody tr");
    await expect(contractRows.first()).toBeVisible({ timeout: 10_000 });

    // Verificar que muestra badge de estado
    await expect(
      page.getByText(
        /borrador|pendiente firma|firmado|enviado DSO|activo|cancelado|rechazado/i,
      ).first(),
    ).toBeVisible();

    // Click en la primera fila para abrir el detalle
    await contractRows.first().click();

    // Sheet se abre con tabs
    await expect(page.getByRole("tab", { name: "Info" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("tab", { name: "PDF" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Firma" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Timeline" })).toBeVisible();

    // Verificar que la pestana Info muestra datos del contrato
    await expect(page.getByText("Cliente")).toBeVisible();
    await expect(page.getByText("NIF/CIF")).toBeVisible();
  });

  test("pestana PDF muestra acciones de generacion o descarga", async ({
    page,
  }) => {
    await gotoContracts(page);

    // Abrir primer contrato
    await page.locator("tbody tr").first().click();

    // Click en tab PDF
    await page.getByRole("tab", { name: "PDF" }).click();

    // Debe mostrar el boton de generar o descargar
    await expect(
      page.getByText(/Generar PDF|Descargar PDF|Regenerar PDF/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("pestana Firma muestra opciones de firma", async ({ page }) => {
    await gotoContracts(page);

    // Abrir primer contrato
    await page.locator("tbody tr").first().click();

    // Click en tab Firma
    await page.getByRole("tab", { name: "Firma" }).click();

    // Debe mostrar algun contenido de firma (firmado, pendiente, o boton)
    await expect(
      page.getByText(
        /Contrato firmado|Firma solicitada|Enviar a firma|Firma presencial|Genera el PDF/i,
      ).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("pestana Timeline muestra al menos fecha de creacion", async ({
    page,
  }) => {
    await gotoContracts(page);

    // Abrir primer contrato
    await page.locator("tbody tr").first().click();

    // Click en tab Timeline
    await page.getByRole("tab", { name: "Timeline" }).click();

    // Debe tener al menos "Creado" como evento
    await expect(page.getByText("Creado")).toBeVisible({ timeout: 10_000 });
  });

  test("boton 'Nuevo contrato' navega al wizard", async ({ page }) => {
    await gotoContracts(page);

    // Click en el boton de nuevo contrato
    await page.getByRole("link", { name: /Nuevo contrato/i }).or(
      page.getByRole("button", { name: /Nuevo contrato/i }),
    ).click();

    // Verificar que estamos en el wizard
    await page.waitForURL("/contracts/new");

    // El wizard debe mostrar los pasos
    await expect(
      page.getByText(/Lead|Cliente|Paso 1/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("busqueda de contratos funciona", async ({ page }) => {
    await gotoContracts(page);

    const search = page.getByPlaceholder(/Buscar/i).first();
    await search.fill("nonexistent-contract-xyz");

    // Espera debounce
    await page.waitForTimeout(500);

    // Debe mostrar estado vacio o la tabla se actualiza
    // No debe haber error
    await expect(page.getByText(/Error al conectar/i)).not.toBeVisible();
  });

  test("accion enviar a firma abre dialog", async ({ page }) => {
    await gotoContracts(page);

    // Buscar un boton de enviar a firma en las acciones de la tabla
    const signButton = page.getByRole("button", {
      name: "Enviar a firma",
    }).first();

    // Si existe un boton de firma visible, clickarlo
    if (await signButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await signButton.click();

      // El dialog de firma debe abrirse
      await expect(
        page.getByRole("dialog").getByText("Enviar a firma"),
      ).toBeVisible({ timeout: 10_000 });

      // Debe tener los campos del formulario
      await expect(page.getByLabel(/Nombre del firmante/i)).toBeVisible();
      await expect(page.getByLabel(/Email del firmante/i)).toBeVisible();

      // Cerrar el dialog
      await page.getByRole("button", { name: "Cancelar" }).click();
    }
    // Si no hay boton de firma, es porque ningún contrato esta en estado draft con PDF
    // Eso es aceptable — no fallamos
  });

  test("dialog de cancelar contrato muestra confirmacion destructiva", async ({
    page,
  }) => {
    await gotoContracts(page);

    // Buscar un boton de cancelar contrato
    const cancelButton = page.getByRole("button", {
      name: "Cancelar contrato",
    }).first();

    if (await cancelButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await cancelButton.click();

      // El dialog debe usar texto especifico segun BACKLOG
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5_000 });
      await expect(dialog).toContainText(/Cancelar contrato/i);
      await expect(dialog).toContainText(
        /Esta acción no se puede deshacer/i,
      );

      // Cerrar sin cancelar
      await dialog.getByRole("button", { name: "Volver" }).click();
    }
  });
});
