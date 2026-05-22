import { defineConfig, devices } from "@playwright/test";

/**
 * Configuración Playwright para `crm-energy-web`.
 *
 * Modelo:
 *  - Tests en `e2e/`. Cada `*.spec.ts` cubre un flujo crítico.
 *  - `webServer`: arranca `pnpm dev` con MSW (`NEXT_PUBLIC_API_MOCKING=enabled`)
 *    en el puerto 3000 antes de los tests. Reutiliza el server local si ya
 *    está corriendo (cómodo en dev, obligatorio resetear en CI).
 *  - `baseURL`: `http://localhost:3000`. Los tests usan rutas relativas.
 *  - Solo un project (chromium desktop) hasta que el smoke esté estable.
 *  - Screenshots y videos: `only-on-failure` para ahorrar disco.
 *
 * No incluido aquí (pertenece a DevOps):
 *  - Setup de GitHub Actions / CI runner con `playwright install --with-deps`.
 *  - Reporter HTML publicado como artifact.
 *  - Sharding cross-PR.
 *
 * Comandos locales:
 *   pnpm e2e               # corre todos los tests
 *   pnpm e2e --headed      # con UI navegador
 *   pnpm e2e --ui          # modo UI interactivo
 *   pnpm exec playwright test --list   # solo lista (smoke seguro en WSL).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["html"], ["github"]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // reason: aceptamos animaciones cortas (cmdk fade, sonner toast slide-in).
    // Sin disable, Radix usa animaciones que cumplen prefers-reduced-motion.
  },
  // Limites: cada test 60s, server up 90s. Si tarda más, algo en MSW falla.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  webServer: {
    command:
      "NEXT_PUBLIC_API_MOCKING=enabled NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_replace_me pnpm dev",
    url: "http://localhost:3000",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
