import { LEAD_FIXTURES } from "./leads";
import { EMPRESAS_STAGE_IDS, STAGE_IDS } from "./pipelines";
import { USER_IDS } from "./users";

/**
 * Activity fixture seed para MSW. Genera ~100 entradas distribuidas entre
 * los 50 leads. Cada lead recibe **1-5 actividades**, siempre con un
 * `lead_created` al inicio (matching `lead.created_at`).
 *
 * Distribución de tipos (≈, sumando ~100 entradas):
 *  - 50  `lead_created` (1 por lead, 100%)
 *  - 9   `note`
 *  - 7   `call`
 *  - 4   `email`
 *  - 7   `whatsapp_inbound`
 *  - 7   `whatsapp_outbound`
 *  - 6   `stage_changed`
 *  - 4   `status_changed`
 *  - 3   `owner_changed`
 *  - 2   `bulk_action`
 *  - 2   `system`
 *
 * Todas las entradas son determinísticas (sin Math.random) para que la
 * demo se repita bit-for-bit entre arranques.
 *
 * Forma alineada con `StoredActivity` (mocks/handlers.ts:35) — payload es
 * un `Record<string, unknown>` y `type` un string del enum
 * `ActivityType`. La unión discriminada del frontend parsea esto sin
 * fricción gracias al `.passthrough()` en cada variante.
 */

export type StoredActivity = {
  id: string;
  lead_id: string;
  actor_user_id: string | null;
  summary: string | null;
  occurred_at: string;
  created_at: string;
  type: string;
  payload: Record<string, unknown>;
};

const U = USER_IDS;

function activityId(n: number): string {
  return `0a1b1c12-0000-0000-0000-${n.toString().padStart(12, "0")}`;
}

/**
 * Suma `n` minutos a un ISO date (siempre devuelve un ISO Z). Util para
 * encadenar timestamps coherentes dentro de un lead.
 */
function plusMinutes(iso: string, minutes: number): string {
  const ts = new Date(iso).getTime() + minutes * 60_000;
  return new Date(ts).toISOString();
}

function plusHours(iso: string, hours: number): string {
  return plusMinutes(iso, hours * 60);
}

function plusDays(iso: string, days: number): string {
  return plusMinutes(iso, days * 24 * 60);
}

/**
 * Genera la entrada `lead_created` para cada lead. Siempre presente en
 * `t = lead.created_at`. Actor null porque la mayoría de demos no
 * asocian creador (los formularios web no autenticados, importaciones,
 * agentes externos…).
 */
function seedLeadCreated(): StoredActivity[] {
  return LEAD_FIXTURES.map((lead, i) => ({
    id: activityId(i + 1),
    lead_id: lead.id,
    actor_user_id: lead.source === "manual" ? lead.owner_id : null,
    summary: null,
    occurred_at: lead.created_at,
    created_at: lead.created_at,
    type: "lead_created",
    payload: {
      pipeline_id: lead.pipeline_id,
      stage_id: lead.stage_id,
      source: lead.source,
    },
  }));
}

/**
 * Entradas adicionales por lead — variadas según el status del lead.
 * No todos los leads tienen extras; solo los que aporten color a la
 * demo (~50 entradas extra). El ID arranca a partir del 100 para no
 * colisionar con `lead_created`.
 */
function seedExtras(): StoredActivity[] {
  const out: StoredActivity[] = [];
  let nextId = 100;
  const nid = () => activityId(nextId++);

  // Lead 1 — María García (Default/new) — nota + WhatsApp inbound.
  const l1 = LEAD_FIXTURES[0]!;
  out.push({
    id: nid(),
    lead_id: l1.id,
    actor_user_id: U.carlos,
    summary: "Llamar el martes para presentar la propuesta",
    occurred_at: plusHours(l1.created_at, 2),
    created_at: plusHours(l1.created_at, 2),
    type: "note",
    payload: {
      body: "Cliente interesada en tarifa 2.0TD. Llamar el martes a las 10am para presentar la propuesta inicial.",
    },
  });
  out.push({
    id: nid(),
    lead_id: l1.id,
    actor_user_id: null,
    summary: "WhatsApp entrante",
    occurred_at: plusHours(l1.created_at, 5),
    created_at: plusHours(l1.created_at, 5),
    type: "whatsapp_inbound",
    payload: {
      text: "Hola, me interesa pedir información sobre la tarifa 2.0TD para mi PYME.",
      media_count: 0,
      wamid: "wamid.HBgLMzQ2MTIzNDU2NzgVAgARGBI2OTk5",
    },
  });

  // Lead 3 — Carmen Martínez — whatsapp out + nota.
  const l3 = LEAD_FIXTURES[2]!;
  out.push({
    id: nid(),
    lead_id: l3.id,
    actor_user_id: U.pedro,
    summary: "Mensaje saliente plantilla 'oferta-inicial'",
    occurred_at: plusHours(l3.created_at, 1),
    created_at: plusHours(l3.created_at, 1),
    type: "whatsapp_outbound",
    payload: {
      text: "Buenas tardes Carmen, aquí tiene la simulación inicial para Cafetería La Pajarita. Disponible para llamada esta semana.",
      status: "delivered",
      template_name: "oferta-inicial",
    },
  });

  // Lead 4 — José Luis (Empresas/new, import) — owner_changed.
  const l4 = LEAD_FIXTURES[3]!;
  out.push({
    id: nid(),
    lead_id: l4.id,
    actor_user_id: U.maria,
    summary: null,
    occurred_at: plusHours(l4.created_at, 4),
    created_at: plusHours(l4.created_at, 4),
    type: "owner_changed",
    payload: {
      from_owner_id: U.carlos,
      to_owner_id: U.ana,
    },
  });

  // Lead 7 — Núria Vives (Empresas/new, import) — bulk_action + system.
  const l7 = LEAD_FIXTURES[6]!;
  out.push({
    id: nid(),
    lead_id: l7.id,
    actor_user_id: U.maria,
    summary: "Importación masiva — primer touchpoint",
    occurred_at: plusMinutes(l7.created_at, 5),
    created_at: plusMinutes(l7.created_at, 5),
    type: "bulk_action",
    payload: {
      action: "add_tags",
      params: { tags: ["industria", "tarifa-6.1TD"], affected_count: 12 },
    },
  });

  // Lead 9 — Pere Soler (referral) — call corta.
  const l9 = LEAD_FIXTURES[8]!;
  out.push({
    id: nid(),
    lead_id: l9.id,
    actor_user_id: U.carlos,
    summary: "Llamada — no responde",
    occurred_at: plusHours(l9.created_at, 6),
    created_at: plusHours(l9.created_at, 6),
    type: "call",
    payload: {
      duration_sec: 18,
      outcome: "no_answer",
    },
  });

  // Lead 12 — Patricia Torres (whatsapp source) — whatsapp_inbound +
  // outbound + email.
  const l12 = LEAD_FIXTURES[11]!;
  out.push({
    id: nid(),
    lead_id: l12.id,
    actor_user_id: null,
    summary: "Solicita info",
    occurred_at: plusMinutes(l12.created_at, 3),
    created_at: plusMinutes(l12.created_at, 3),
    type: "whatsapp_inbound",
    payload: {
      text: "Buenos días, somos una clínica dental en Madrid y queremos comparar tarifas.",
      media_count: 1,
    },
  });
  out.push({
    id: nid(),
    lead_id: l12.id,
    actor_user_id: U.ana,
    summary: null,
    occurred_at: plusHours(l12.created_at, 1),
    created_at: plusHours(l12.created_at, 1),
    type: "whatsapp_outbound",
    payload: {
      text: "Hola Patricia, gracias por contactar. Le envío la propuesta para clínicas (~150 m²) por email en 30 min.",
      status: "read",
    },
  });
  out.push({
    id: nid(),
    lead_id: l12.id,
    actor_user_id: U.ana,
    summary: "Envío propuesta tarifa 2.0TD oficina",
    occurred_at: plusHours(l12.created_at, 2),
    created_at: plusHours(l12.created_at, 2),
    type: "email",
    payload: {
      subject: "Propuesta tarifa energética — Clínica Dental Sonrisa",
      body: "Estimada Patricia, adjunto la simulación de ahorro para su clínica. Ahorro estimado: 18% anual.",
      sent_to: l12.email,
      opened: true,
    },
  });

  // Lead 16 — Ana Martínez (contacted) — stage_changed + status_changed +
  // note.
  const l16 = LEAD_FIXTURES[15]!;
  out.push({
    id: nid(),
    lead_id: l16.id,
    actor_user_id: U.carlos,
    summary: null,
    occurred_at: plusDays(l16.created_at, 2),
    created_at: plusDays(l16.created_at, 2),
    type: "stage_changed",
    payload: {
      from_stage_id: STAGE_IDS.new,
      to_stage_id: STAGE_IDS.contacted,
      from_stage_name: "Nuevo",
      to_stage_name: "Contactado",
    },
  });
  out.push({
    id: nid(),
    lead_id: l16.id,
    actor_user_id: U.carlos,
    summary: null,
    occurred_at: plusDays(l16.created_at, 2),
    created_at: plusDays(l16.created_at, 2),
    type: "status_changed",
    payload: { from_status: "new", to_status: "contacted" },
  });
  out.push({
    id: nid(),
    lead_id: l16.id,
    actor_user_id: U.carlos,
    summary: "Primera llamada",
    occurred_at: plusDays(l16.created_at, 2),
    created_at: plusDays(l16.created_at, 2),
    type: "call",
    payload: {
      duration_sec: 245,
      outcome: "answered",
    },
  });

  // Lead 17 — David Fernández — note + call.
  const l17 = LEAD_FIXTURES[16]!;
  out.push({
    id: nid(),
    lead_id: l17.id,
    actor_user_id: U.laura,
    summary: "Compara con Audax",
    occurred_at: plusDays(l17.created_at, 1),
    created_at: plusDays(l17.created_at, 1),
    type: "note",
    payload: {
      body: "Mencionó que también compara con Audax Energía. Insistir en bonificación de gestoría incluida.",
    },
  });
  out.push({
    id: nid(),
    lead_id: l17.id,
    actor_user_id: U.laura,
    summary: "Repasamos consumo histórico",
    occurred_at: plusDays(l17.created_at, 5),
    created_at: plusDays(l17.created_at, 5),
    type: "call",
    payload: {
      duration_sec: 612,
      outcome: "answered",
    },
  });

  // Lead 18 — Sofía Hernández (Empresas) — stage_changed (new→contacted)
  // + WhatsApp + note.
  const l18 = LEAD_FIXTURES[17]!;
  out.push({
    id: nid(),
    lead_id: l18.id,
    actor_user_id: U.pedro,
    summary: null,
    occurred_at: plusDays(l18.created_at, 1),
    created_at: plusDays(l18.created_at, 1),
    type: "stage_changed",
    payload: {
      from_stage_id: EMPRESAS_STAGE_IDS.new,
      to_stage_id: EMPRESAS_STAGE_IDS.contacted,
      from_stage_name: "Prospecto inicial",
      to_stage_name: "Auditoría energética",
      note: "Pasamos a auditoría tras llamada introductoria",
    },
  });
  out.push({
    id: nid(),
    lead_id: l18.id,
    actor_user_id: null,
    summary: "Confirma cita",
    occurred_at: plusDays(l18.created_at, 1),
    created_at: plusDays(l18.created_at, 1),
    type: "whatsapp_inbound",
    payload: { text: "Perfecto, nos vemos el martes a las 11 entonces. Gracias!" },
  });

  // Lead 19 — Diego Vázquez — voicemail.
  const l19 = LEAD_FIXTURES[18]!;
  out.push({
    id: nid(),
    lead_id: l19.id,
    actor_user_id: U.ana,
    summary: "Buzón de voz",
    occurred_at: plusDays(l19.created_at, 3),
    created_at: plusDays(l19.created_at, 3),
    type: "call",
    payload: { duration_sec: 32, outcome: "voicemail" },
  });

  // Lead 22 — Marta Llopis (Empresas, contacted) — bulk_action +
  // owner_changed + note.
  const l22 = LEAD_FIXTURES[21]!;
  out.push({
    id: nid(),
    lead_id: l22.id,
    actor_user_id: U.maria,
    summary: null,
    occurred_at: plusDays(l22.created_at, 1),
    created_at: plusDays(l22.created_at, 1),
    type: "bulk_action",
    payload: {
      action: "change_status",
      params: { to_status: "contacted", affected_count: 8 },
    },
  });
  out.push({
    id: nid(),
    lead_id: l22.id,
    actor_user_id: U.maria,
    summary: null,
    occurred_at: plusDays(l22.created_at, 2),
    created_at: plusDays(l22.created_at, 2),
    type: "owner_changed",
    payload: { from_owner_id: U.laura, to_owner_id: U.pedro },
  });

  // Lead 26 — Mónica Gil (Empresas, contacted, VIP) — email + whatsapp +
  // stage_changed con nota.
  const l26 = LEAD_FIXTURES[25]!;
  out.push({
    id: nid(),
    lead_id: l26.id,
    actor_user_id: U.pedro,
    summary: "Envío propuesta personalizada",
    occurred_at: plusDays(l26.created_at, 5),
    created_at: plusDays(l26.created_at, 5),
    type: "email",
    payload: {
      subject: "Propuesta corporate — Distribuciones Cantábricas",
      body: "Mónica, adjunto comparativa tarifaria 6.1TD con bonificación por volumen.",
      sent_to: l26.email,
      opened: true,
    },
  });
  out.push({
    id: nid(),
    lead_id: l26.id,
    actor_user_id: null,
    summary: "Confirma recepción",
    occurred_at: plusDays(l26.created_at, 5),
    created_at: plusDays(l26.created_at, 5),
    type: "whatsapp_inbound",
    payload: { text: "Recibida la propuesta. La estudio y te digo." },
  });

  // Lead 28 — Beatriz Ortega (qualified) — stage_changed +
  // status_changed + call larga.
  const l28 = LEAD_FIXTURES[27]!;
  out.push({
    id: nid(),
    lead_id: l28.id,
    actor_user_id: U.carlos,
    summary: null,
    occurred_at: plusDays(l28.created_at, 10),
    created_at: plusDays(l28.created_at, 10),
    type: "stage_changed",
    payload: {
      from_stage_id: STAGE_IDS.contacted,
      to_stage_id: STAGE_IDS.qualified,
      from_stage_name: "Contactado",
      to_stage_name: "Cualificado",
    },
  });
  out.push({
    id: nid(),
    lead_id: l28.id,
    actor_user_id: U.carlos,
    summary: null,
    occurred_at: plusDays(l28.created_at, 10),
    created_at: plusDays(l28.created_at, 10),
    type: "status_changed",
    payload: { from_status: "contacted", to_status: "qualified" },
  });
  out.push({
    id: nid(),
    lead_id: l28.id,
    actor_user_id: U.carlos,
    summary: "Reunión técnica con responsable de instalaciones",
    occurred_at: plusDays(l28.created_at, 12),
    created_at: plusDays(l28.created_at, 12),
    type: "call",
    payload: { duration_sec: 1840, outcome: "answered" },
  });
  out.push({
    id: nid(),
    lead_id: l28.id,
    actor_user_id: U.carlos,
    summary: "Negociación abierta",
    occurred_at: plusDays(l28.created_at, 14),
    created_at: plusDays(l28.created_at, 14),
    type: "note",
    payload: {
      body: "Le interesa empezar con tarifa 3.0TD y revisar a 12 meses si conviene 6.1TD. Pidió por escrito condiciones de salida.",
    },
  });

  // Lead 29 — Joan Puig (VIP qualified, referral) — sistema (auto-tag
  // VIP), nota, email.
  const l29 = LEAD_FIXTURES[28]!;
  out.push({
    id: nid(),
    lead_id: l29.id,
    actor_user_id: null,
    summary: "Etiqueta VIP asignada automáticamente",
    occurred_at: plusHours(l29.created_at, 2),
    created_at: plusHours(l29.created_at, 2),
    type: "system",
    payload: {
      reason: "auto-tag-vip",
      message: "estimated_value_cents > 1_000_000 → tag 'vip' añadido por la regla automática.",
    },
  });
  out.push({
    id: nid(),
    lead_id: l29.id,
    actor_user_id: U.laura,
    summary: null,
    occurred_at: plusDays(l29.created_at, 3),
    created_at: plusDays(l29.created_at, 3),
    type: "email",
    payload: {
      subject: "Auditoría energética — Industria Catalana",
      body: "Joan, te confirmo la auditoría para el día 28. Adjunto checklist.",
      sent_to: l29.email,
      opened: false,
    },
  });

  // Lead 33 — Tomás Aguilar (Empresas qualified VIP) — stage_changed +
  // owner_changed.
  const l33 = LEAD_FIXTURES[32]!;
  out.push({
    id: nid(),
    lead_id: l33.id,
    actor_user_id: U.maria,
    summary: null,
    occurred_at: plusDays(l33.created_at, 4),
    created_at: plusDays(l33.created_at, 4),
    type: "stage_changed",
    payload: {
      from_stage_id: EMPRESAS_STAGE_IDS.contacted,
      to_stage_id: EMPRESAS_STAGE_IDS.qualified,
      from_stage_name: "Auditoría energética",
      to_stage_name: "Propuesta enviada",
    },
  });
  out.push({
    id: nid(),
    lead_id: l33.id,
    actor_user_id: U.maria,
    summary: null,
    occurred_at: plusDays(l33.created_at, 7),
    created_at: plusDays(l33.created_at, 7),
    type: "owner_changed",
    payload: { from_owner_id: U.carlos, to_owner_id: U.laura },
  });

  // Lead 39 — Carlos Fernández (won, VIP) — chain completo →
  // stage_changed × 2 + status_changed + nota cierre.
  const l39 = LEAD_FIXTURES[38]!;
  out.push({
    id: nid(),
    lead_id: l39.id,
    actor_user_id: U.carlos,
    summary: null,
    occurred_at: plusDays(l39.created_at, 3),
    created_at: plusDays(l39.created_at, 3),
    type: "stage_changed",
    payload: {
      from_stage_id: STAGE_IDS.new,
      to_stage_id: STAGE_IDS.contacted,
      from_stage_name: "Nuevo",
      to_stage_name: "Contactado",
    },
  });
  out.push({
    id: nid(),
    lead_id: l39.id,
    actor_user_id: U.carlos,
    summary: null,
    occurred_at: plusDays(l39.created_at, 10),
    created_at: plusDays(l39.created_at, 10),
    type: "stage_changed",
    payload: {
      from_stage_id: STAGE_IDS.contacted,
      to_stage_id: STAGE_IDS.won,
      from_stage_name: "Contactado",
      to_stage_name: "Ganado",
      note: "Cliente firmó contrato 3.0TD",
    },
  });
  out.push({
    id: nid(),
    lead_id: l39.id,
    actor_user_id: U.carlos,
    summary: null,
    occurred_at: plusDays(l39.created_at, 10),
    created_at: plusDays(l39.created_at, 10),
    type: "status_changed",
    payload: { from_status: "contacted", to_status: "won" },
  });
  out.push({
    id: nid(),
    lead_id: l39.id,
    actor_user_id: U.carlos,
    summary: null,
    occurred_at: plusDays(l39.created_at, 14),
    created_at: plusDays(l39.created_at, 14),
    type: "note",
    payload: {
      body: "Contrato firmado por 24 meses. Cliente muy satisfecho. Referirá a otros hoteles.",
    },
  });

  // Lead 41 — Lluís Marí (Empresas won VIP) — email + stage_changed.
  const l41 = LEAD_FIXTURES[40]!;
  out.push({
    id: nid(),
    lead_id: l41.id,
    actor_user_id: U.pedro,
    summary: "Confirmación firma",
    occurred_at: plusDays(l41.created_at, 30),
    created_at: plusDays(l41.created_at, 30),
    type: "email",
    payload: {
      subject: "Confirmación firma contrato — Industria Catalana SA",
      body: "Lluís, contrato firmado digitalmente. Inicio de suministro 1 julio.",
      sent_to: l41.email,
      opened: true,
    },
  });
  out.push({
    id: nid(),
    lead_id: l41.id,
    actor_user_id: U.pedro,
    summary: null,
    occurred_at: plusDays(l41.created_at, 30),
    created_at: plusDays(l41.created_at, 30),
    type: "stage_changed",
    payload: {
      from_stage_id: EMPRESAS_STAGE_IDS.negotiation,
      to_stage_id: EMPRESAS_STAGE_IDS.won,
      from_stage_name: "Negociación",
      to_stage_name: "Cerrado-Ganado",
    },
  });

  // Lead 46 — Lucía Mendieta (lost) — system auto-archived.
  const l46 = LEAD_FIXTURES[45]!;
  out.push({
    id: nid(),
    lead_id: l46.id,
    actor_user_id: null,
    summary: "Lead archivado tras 90 días sin contacto",
    occurred_at: plusDays(l46.last_contacted_at ?? l46.created_at, 90),
    created_at: plusDays(l46.last_contacted_at ?? l46.created_at, 90),
    type: "system",
    payload: {
      reason: "auto-archived",
      message: "Lead archivado tras 90 días sin contacto. Regla auto-stage.",
    },
  });
  out.push({
    id: nid(),
    lead_id: l46.id,
    actor_user_id: U.ana,
    summary: null,
    occurred_at: plusDays(l46.created_at, 5),
    created_at: plusDays(l46.created_at, 5),
    type: "note",
    payload: { body: "No responde a llamadas ni emails. Cierro como perdido." },
  });

  // Lead 48 — Jaime Olivares (Empresas, lost no_responde) — call no_answer
  // + stage_changed.
  const l48 = LEAD_FIXTURES[47]!;
  out.push({
    id: nid(),
    lead_id: l48.id,
    actor_user_id: U.laura,
    summary: null,
    occurred_at: plusDays(l48.created_at, 7),
    created_at: plusDays(l48.created_at, 7),
    type: "call",
    payload: { duration_sec: 8, outcome: "no_answer" },
  });
  out.push({
    id: nid(),
    lead_id: l48.id,
    actor_user_id: U.laura,
    summary: null,
    occurred_at: plusDays(l48.created_at, 25),
    created_at: plusDays(l48.created_at, 25),
    type: "stage_changed",
    payload: {
      from_stage_id: EMPRESAS_STAGE_IDS.contacted,
      to_stage_id: EMPRESAS_STAGE_IDS.lost,
      from_stage_name: "Auditoría energética",
      to_stage_name: "Cerrado-Perdido",
    },
  });

  // Lead 40 — Rui Almeida (won referral) — WhatsApp outbound + email
  // confirm.
  const l40 = LEAD_FIXTURES[39]!;
  out.push({
    id: nid(),
    lead_id: l40.id,
    actor_user_id: U.laura,
    summary: null,
    occurred_at: plusDays(l40.created_at, 1),
    created_at: plusDays(l40.created_at, 1),
    type: "whatsapp_outbound",
    payload: {
      text: "Hola Rui, te confirmo recepción. Te llamo mañana para concretar.",
      status: "read",
    },
  });

  // Lead 44 — Verónica Aroca (Empresas won) — sistema + bulk + call larga.
  const l44 = LEAD_FIXTURES[43]!;
  out.push({
    id: nid(),
    lead_id: l44.id,
    actor_user_id: U.pedro,
    summary: "Reunión presencial",
    occurred_at: plusDays(l44.created_at, 12),
    created_at: plusDays(l44.created_at, 12),
    type: "call",
    payload: { duration_sec: 2750, outcome: "answered" },
  });
  out.push({
    id: nid(),
    lead_id: l44.id,
    actor_user_id: U.pedro,
    summary: null,
    occurred_at: plusDays(l44.created_at, 20),
    created_at: plusDays(l44.created_at, 20),
    type: "stage_changed",
    payload: {
      from_stage_id: EMPRESAS_STAGE_IDS.qualified,
      to_stage_id: EMPRESAS_STAGE_IDS.won,
      from_stage_name: "Propuesta enviada",
      to_stage_name: "Cerrado-Ganado",
      note: "Firmaron tras tercera reunión",
    },
  });

  // Lead 47 — Marta Iglesias (import, lost) — owner_changed + nota.
  const l47 = LEAD_FIXTURES[46]!;
  out.push({
    id: nid(),
    lead_id: l47.id,
    actor_user_id: U.maria,
    summary: null,
    occurred_at: plusDays(l47.created_at, 4),
    created_at: plusDays(l47.created_at, 4),
    type: "owner_changed",
    payload: { from_owner_id: null, to_owner_id: U.carlos },
  });
  out.push({
    id: nid(),
    lead_id: l47.id,
    actor_user_id: U.carlos,
    summary: null,
    occurred_at: plusDays(l47.created_at, 8),
    created_at: plusDays(l47.created_at, 8),
    type: "note",
    payload: { body: "Comparó nuestra oferta con la de Iberdrola. Cerró con ellos por -8% en término fijo." },
  });

  // Lead 30 — Elena Cabrera (Empresas qualified) — email + note.
  const l30 = LEAD_FIXTURES[29]!;
  out.push({
    id: nid(),
    lead_id: l30.id,
    actor_user_id: U.pedro,
    summary: null,
    occurred_at: plusDays(l30.created_at, 6),
    created_at: plusDays(l30.created_at, 6),
    type: "email",
    payload: {
      subject: "Propuesta consolidada — Logística Norte",
      body: "Elena, adjunto la propuesta consolidada incluyendo bonificación por volumen anual.",
      sent_to: l30.email,
      opened: true,
    },
  });
  out.push({
    id: nid(),
    lead_id: l30.id,
    actor_user_id: U.pedro,
    summary: "Pidió cláusula de salida 90d",
    occurred_at: plusDays(l30.created_at, 10),
    created_at: plusDays(l30.created_at, 10),
    type: "note",
    payload: { body: "Pidió cláusula de salida con preaviso 90 días. Aceptable." },
  });

  // Lead 11 — Jordi Roca (Empresas/new) — note follow-up.
  const l11 = LEAD_FIXTURES[10]!;
  out.push({
    id: nid(),
    lead_id: l11.id,
    actor_user_id: U.pedro,
    summary: "Pidieron tiempo para decidir",
    occurred_at: plusDays(l11.created_at, 2),
    created_at: plusDays(l11.created_at, 2),
    type: "note",
    payload: { body: "Necesitan revisar el contrato con el gestor. Llamada en 2 semanas." },
  });

  // Lead 26 extra — stage_changed.
  out.push({
    id: nid(),
    lead_id: l26.id,
    actor_user_id: U.pedro,
    summary: null,
    occurred_at: plusDays(l26.created_at, 7),
    created_at: plusDays(l26.created_at, 7),
    type: "stage_changed",
    payload: {
      from_stage_id: EMPRESAS_STAGE_IDS.new,
      to_stage_id: EMPRESAS_STAGE_IDS.contacted,
      from_stage_name: "Prospecto inicial",
      to_stage_name: "Auditoría energética",
    },
  });

  // Lead 50 — Gonzalo Reyes (lost referral) — WhatsApp inbound.
  const l50 = LEAD_FIXTURES[49]!;
  out.push({
    id: nid(),
    lead_id: l50.id,
    actor_user_id: null,
    summary: null,
    occurred_at: plusDays(l50.created_at, 12),
    created_at: plusDays(l50.created_at, 12),
    type: "whatsapp_inbound",
    payload: { text: "Lo siento, hemos decidido seguir con nuestro proveedor actual." },
  });

  // Lead 35 — Felipe Ramírez (qualified agent) — sistema (auto-stage)
  // pendiente, ilustrativo.
  const l35 = LEAD_FIXTURES[34]!;
  out.push({
    id: nid(),
    lead_id: l35.id,
    actor_user_id: null,
    summary: "Auto-stage propuso pasar a 'qualified'",
    occurred_at: plusDays(l35.created_at, 4),
    created_at: plusDays(l35.created_at, 4),
    type: "system",
    payload: {
      reason: "auto-stage-suggested",
      message:
        "Regla 'auto-stage' sugirió pasar de Contactado → Cualificado tras 2 emails respondidos. Aprobado por comercial.",
    },
  });
  // Lead 32 — Cristina López (qualified whatsapp) — bulk add_tags.
  const l32 = LEAD_FIXTURES[31]!;
  out.push({
    id: nid(),
    lead_id: l32.id,
    actor_user_id: U.maria,
    summary: null,
    occurred_at: plusDays(l32.created_at, 1),
    created_at: plusDays(l32.created_at, 1),
    type: "bulk_action",
    payload: {
      action: "add_tags",
      params: { tags: ["sevilla"], affected_count: 5 },
    },
  });

  return out;
}

export const ACTIVITY_FIXTURES: StoredActivity[] = [
  ...seedLeadCreated(),
  ...seedExtras(),
];
