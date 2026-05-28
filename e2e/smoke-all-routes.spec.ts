import { expect, test } from "@playwright/test";

/**
 * Smoke test -- visits every route and verifies no crash / error 500.
 *
 * Runs against dev server with MSW enabled (demo mode).
 * Each route should render without throwing or showing an error page.
 */

const AUTHENTICATED_ROUTES = [
  "/dashboard",
  "/leads",
  "/pipeline",
  "/cups",
  "/contracts",
  "/contracts/new",
  "/atr",
  "/tickets",
  "/commissions",
  "/settings",
];

const PORTAL_ROUTES = [
  "/portal",
  "/portal/consumption",
  "/portal/invoices",
  "/portal/power",
];

test.describe("Smoke test: all authenticated routes", () => {
  for (const route of AUTHENTICATED_ROUTES) {
    test(`${route} loads without error`, async ({ page }) => {
      await page.goto(route);
      // Wait for the page to be interactive
      await page.waitForLoadState("networkidle");

      // Should not show error page
      const errorHeading = page.locator("h1:has-text('Error')");
      await expect(errorHeading).not.toBeVisible();

      // Should not show Next.js error overlay
      const nextError = page.locator("#__next-route-announcer ~ [data-nextjs-dialog]");
      await expect(nextError).not.toBeVisible();

      // Should not show "500" anywhere prominent
      const body = await page.textContent("body");
      expect(body).not.toContain("500 Internal Server Error");
    });
  }
});

test.describe("Smoke test: all portal routes", () => {
  for (const route of PORTAL_ROUTES) {
    test(`${route} loads without error`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      const errorHeading = page.locator("h1:has-text('Error')");
      await expect(errorHeading).not.toBeVisible();

      const body = await page.textContent("body");
      expect(body).not.toContain("500 Internal Server Error");
    });
  }
});

test("sign-in page loads in demo mode", async ({ page }) => {
  await page.goto("/sign-in");
  await page.waitForLoadState("networkidle");

  // Should show demo mode splash
  await expect(
    page.locator("text=Entrar en modo demo"),
  ).toBeVisible();
});
