import type { components } from "@/lib/api/types";
import { TENANT_ID } from "./pipelines";

type UserListItem = components["schemas"]["UserListItem"];
type MeOut = components["schemas"]["MeOut"];

/**
 * 8 usuarios fixture para alimentar `GET /v1/users` y resolver
 * `actor_user_id`/`owner_id` a nombre humano en la UI.
 *
 * Distribución de roles (espeja el seed que el backend hace para tenants
 * demo): 1 admin, 4 sales, 2 agent (support), 1 viewer.
 *
 * `currentUserFixture` apunta a **Carlos Ruiz** (sales) — el rol más
 * representativo del usuario que verá la demo (no admin, no viewer).
 *
 * UUIDs v4 estrictos (Zod los valida con 3er segmento `4` y 4to `[89ab]`).
 */

export const USER_IDS = {
  maria: "55555555-5555-4555-8555-550000000001",
  carlos: "55555555-5555-4555-8555-550000000002",
  laura: "55555555-5555-4555-8555-550000000003",
  pedro: "55555555-5555-4555-8555-550000000004",
  ana: "55555555-5555-4555-8555-550000000005",
  jorge: "55555555-5555-4555-8555-550000000006",
  lucia: "55555555-5555-4555-8555-550000000007",
  diego: "55555555-5555-4555-8555-550000000008",
} as const;

export const usersFixture: UserListItem[] = [
  {
    id: USER_IDS.maria,
    email: "mhernandez@panda.energy",
    name: "María Hernández",
    role: "admin",
  },
  {
    id: USER_IDS.carlos,
    email: "cruiz@panda.energy",
    name: "Carlos Ruiz",
    role: "sales",
  },
  {
    id: USER_IDS.laura,
    email: "lmartin@panda.energy",
    name: "Laura Martín",
    role: "sales",
  },
  {
    id: USER_IDS.pedro,
    email: "psanchez@panda.energy",
    name: "Pedro Sánchez",
    role: "sales",
  },
  {
    id: USER_IDS.ana,
    email: "atorres@panda.energy",
    name: "Ana Torres",
    role: "sales",
  },
  {
    id: USER_IDS.jorge,
    email: "jvega@panda.energy",
    name: "Jorge Vega",
    role: "agent",
  },
  {
    id: USER_IDS.lucia,
    email: "lromero@panda.energy",
    name: "Lucía Romero",
    role: "agent",
  },
  {
    id: USER_IDS.diego,
    email: "dcastro@panda.energy",
    name: "Diego Castro",
    role: "viewer",
  },
];

/**
 * Usuario que respalda la sesión Clerk en modo demo. `GET /v1/auth/me`
 * devuelve esto + `default_pipeline_id` rellenado por el handler.
 *
 * Carlos Ruiz (sales) — perfil más representativo del comercial que
 * usaría el CRM 8h/día.
 */
export const currentUserFixture: Omit<MeOut, "default_pipeline_id"> = {
  id: USER_IDS.carlos,
  tenant_id: TENANT_ID,
  clerk_user_id: "user_demo_carlos",
  email: "cruiz@panda.energy",
  name: "Carlos Ruiz",
  first_name: "Carlos",
  last_name: "Ruiz",
  image_url: null,
  role: "sales",
  last_seen_at: "2026-05-22T08:00:00.000Z",
  created_at: "2026-04-01T08:00:00.000Z",
};
