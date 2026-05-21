import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/**
 * Worker MSW para el navegador.
 *
 * Sólo se arranca si `NEXT_PUBLIC_API_MOCKING === "enabled"` (ver
 * `MswProvider`). En producción el worker NO se carga (no se importa).
 */
export const worker = setupWorker(...handlers);
