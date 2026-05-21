/**
 * Schemas Zod para los tipos críticos del Sprint 1.
 *
 * **Importante:** la **fuente de verdad** del contrato sigue siendo el
 * OpenAPI del backend (regla cross-skill #7). `lib/api/types.ts` se genera
 * con `pnpm gen:types` y NO se edita a mano.
 *
 * Estos schemas existen como capa de **boundary validation**: validamos la
 * respuesta del backend en tiempo de ejecución para detectar contratos rotos
 * en producción (e.g. backend serializa mal una fecha, devuelve null donde
 * debería venir string, etc.) y fallar rápido con un error legible.
 *
 * Convenciones:
 *  - El tipo derivado con `z.infer<typeof FooSchema>` debe ser **asignable**
 *    al tipo OpenAPI correspondiente (`components["schemas"]["Foo"]`). Si
 *    alguien rompe esa compatibilidad, lo detecta el typecheck del array
 *    `_compatibilityChecks` al final del archivo.
 *  - Solo escribimos schemas para tipos que entran en el árbol de UI crítico
 *    (`Lead`, `LeadPage`, `User`). Estructuras de admin / debug no se validan.
 *  - Los tipos primitivos OpenAPI se mapean así:
 *      `format: uuid` → `z.string().uuid()`
 *      `format: email` → `z.string().email()`
 *      `format: date-time` → `z.string().datetime()`
 *      `enum: [...]` → `z.enum([...])`
 */
import { z } from "zod";
import type { components } from "./types";

// ── Enums ───────────────────────────────────────────────────────────────────

export const RoleSchema = z.enum(["admin", "sales", "support"]);

export const LeadStatusSchema = z.enum([
  "new",
  "qualified",
  "contacted",
  "won",
  "lost",
]);

// ── User ────────────────────────────────────────────────────────────────────

export const UserSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: RoleSchema,
});
export type CurrentUser = z.infer<typeof UserSchema>;

// ── Lead ────────────────────────────────────────────────────────────────────

export const LeadSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  status: LeadStatusSchema,
  source: z.string(),
  ownerId: z.string().uuid(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});
export type Lead = z.infer<typeof LeadSchema>;

export const LeadCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  status: LeadStatusSchema,
  source: z.string().min(1),
});
export type LeadCreate = z.infer<typeof LeadCreateSchema>;

export const LeadPageSchema = z.object({
  items: z.array(LeadSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
});
export type LeadPage = z.infer<typeof LeadPageSchema>;

// ── Problem Details (RFC 7807) ──────────────────────────────────────────────

export const ProblemSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  correlationId: z.string().optional(),
});
export type Problem = z.infer<typeof ProblemSchema>;

// ── Compatibility checks ────────────────────────────────────────────────────
// Si estos tipos no son asignables a los OpenAPI generados, el typecheck rompe
// el build. Es la red de seguridad que evita que los Zod schemas se desvíen
// silenciosamente del contrato.

// reason: estas declaraciones existen solo para forzar el chequeo estructural
// del compilador TS; no se importan en runtime y la convención es prefijarlas
// con `_` para que ESLint no avise de "unused".
type _UserCompat = components["schemas"]["User"] extends CurrentUser
  ? CurrentUser extends components["schemas"]["User"]
    ? true
    : false
  : false;
type _LeadCompat = components["schemas"]["Lead"] extends Lead
  ? Lead extends components["schemas"]["Lead"]
    ? true
    : false
  : false;
type _LeadCreateCompat =
  components["schemas"]["LeadCreate"] extends LeadCreate
    ? LeadCreate extends components["schemas"]["LeadCreate"]
      ? true
      : false
    : false;
type _LeadPageCompat = components["schemas"]["LeadPage"] extends LeadPage
  ? LeadPage extends components["schemas"]["LeadPage"]
    ? true
    : false
  : false;

// Si alguno de estos no es `true`, el typecheck falla en el ensamblado.
const _compatibilityChecks: [
  _UserCompat,
  _LeadCompat,
  _LeadCreateCompat,
  _LeadPageCompat,
] = [true, true, true, true];
void _compatibilityChecks;
