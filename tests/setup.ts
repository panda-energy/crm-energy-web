import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "@/mocks/server";

/**
 * Lifecycle global de MSW para tests:
 *  - listen() antes de todos los tests
 *  - resetHandlers() entre tests (handlers ad-hoc no se filtran)
 *  - close() al final
 */
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
