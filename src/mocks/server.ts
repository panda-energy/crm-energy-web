import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * Servidor MSW para Vitest (entorno Node). Lo arranca/cierra el
 * `tests/setup.ts` global.
 */
export const server = setupServer(...handlers);
