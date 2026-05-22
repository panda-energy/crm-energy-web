import type { components } from "@/lib/api/types";
import { TENANT_ID } from "./pipelines";

type UserListItem = components["schemas"]["UserListItem"];
type MeOut = components["schemas"]["MeOut"];

/**
 * 6 usuarios fixture variados (admin, sales, agent, viewer) para alimentar
 * MSW `GET /v1/users`. UUIDs determinísticos para que el filtro
 * "Propietario" y el bulk-action de asignar propietario se prueben con
 * datos repetibles.
 *
 * `id` del primer admin coincide con `currentUserFixture.id` — ese es el
 * usuario que `GET /v1/auth/me` devuelve en modo demo.
 */

/**
 * UUIDs v4 estrictos (Zod v4 los valida así: 3er segmento empieza por
 * `4`, 4to por `[89ab]`). Si añades nuevos usuarios, conserva esa forma.
 */
export const USER_IDS = {
  alex: "55555555-5555-4555-8555-550000000001",
  beatriz: "55555555-5555-4555-8555-550000000002",
  carla: "55555555-5555-4555-8555-550000000003",
  diego: "55555555-5555-4555-8555-550000000004",
  eva: "55555555-5555-4555-8555-550000000005",
  felipe: "55555555-5555-4555-8555-550000000006",
} as const;

export const usersFixture: UserListItem[] = [
  {
    id: USER_IDS.alex,
    email: "alex.admin@panda.energy",
    name: "Alex Admin",
    role: "admin",
  },
  {
    id: USER_IDS.beatriz,
    email: "beatriz.sales@panda.energy",
    name: "Beatriz Sales",
    role: "sales",
  },
  {
    id: USER_IDS.carla,
    email: "carla.sales@panda.energy",
    name: "Carla Field",
    role: "sales",
  },
  {
    id: USER_IDS.diego,
    email: "diego.support@panda.energy",
    name: "Diego Support",
    role: "agent",
  },
  {
    id: USER_IDS.eva,
    email: "eva.support@panda.energy",
    name: "Eva Ops",
    role: "agent",
  },
  {
    id: USER_IDS.felipe,
    email: "felipe.read@panda.energy",
    name: null,
    role: "viewer",
  },
];

/**
 * Usuario que respalda la sesión Clerk en modo demo. `GET /v1/auth/me`
 * devuelve esto + `default_pipeline_id` rellenado por el handler.
 */
export const currentUserFixture: Omit<MeOut, "default_pipeline_id"> = {
  id: USER_IDS.alex,
  tenant_id: TENANT_ID,
  clerk_user_id: "user_demo_alex",
  email: "alex.admin@panda.energy",
  name: "Alex Admin",
  first_name: "Alex",
  last_name: "Admin",
  image_url: null,
  role: "admin",
  last_seen_at: "2026-05-22T08:00:00.000Z",
  created_at: "2026-04-01T08:00:00.000Z",
};
