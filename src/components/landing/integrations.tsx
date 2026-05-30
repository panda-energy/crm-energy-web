"use client";

import { motion } from "framer-motion";
import {
  MessageCircle, PenTool, Database, Building2,
  TrendingUp, Shield, Cloud, Brain,
} from "lucide-react";
import { useInView } from "./use-in-view";
import { useLandingT } from "./i18n";

const INTEGRATIONS = [
  { icon: MessageCircle, name: "WhatsApp Business" },
  { icon: PenTool, name: "Signaturit" },
  { icon: Database, name: "CNMC / SIPS" },
  { icon: Building2, name: "5 distribuidoras" },
  { icon: TrendingUp, name: "OMIE" },
  { icon: Brain, name: "Claude + OpenAI" },
  { icon: Shield, name: "Clerk" },
  { icon: Cloud, name: "Cloudflare R2" },
] as const;

const DESCS: Record<string, { es: string; en: string; pt: string; fr: string }> = {
  "WhatsApp Business": { es: "Comunicacion bidireccional y captacion automatica de leads", en: "Bidirectional communication and automatic lead capture", pt: "Comunicação bidirecional e captação automatica de leads", fr: "Communication bidirectionnelle et captation automatique de leads" },
  "Signaturit": { es: "Firma electronica con validez legal europea eIDAS", en: "Electronic signature with European eIDAS legal validity", pt: "Assinatura eletrônica com validade legal europeia eIDAS", fr: "Signature électronique avec validité légale européenne eIDAS" },
  "CNMC / SIPS": { es: "Datos oficiales de puntos de suministro en tiempo real", en: "Official supply point data in real time", pt: "Dados oficiais de pontos de fornecimento em tempo real", fr: "Données officielles des points de fourniture en temps réel" },
  "5 distribuidoras": { es: "e-distribucion, i-DE, UFD, Viesgo, Begasa — cobertura >80%", en: "e-distribucion, i-DE, UFD, Viesgo, Begasa — >80% coverage", pt: "e-distribucion, i-DE, UFD, Viesgo, Begasa — cobertura >80%", fr: "e-distribucion, i-DE, UFD, Viesgo, Begasa — couverture >80%" },
  "OMIE": { es: "Precios mayoristas hora a hora para tarifas indexadas", en: "Hourly wholesale prices for indexed tariffs", pt: "Preços de atacado hora a hora para tarifas indexadas", fr: "Prix de gros heure par heure pour les tarifs indexés" },
  "Claude + OpenAI": { es: "IA de grado empresarial con fallback automatico", en: "Enterprise-grade AI with automatic fallback", pt: "IA de grau empresarial com fallback automatico", fr: "IA de niveau entreprise avec fallback automatique" },
  "Clerk": { es: "Autenticacion segura con SSO (Google, Microsoft)", en: "Secure authentication with SSO (Google, Microsoft)", pt: "Autenticação segura com SSO (Google, Microsoft)", fr: "Authentification sécurisée avec SSO (Google, Microsoft)" },
  "Cloudflare R2": { es: "Almacenamiento cifrado en centros de datos UE", en: "Encrypted storage in EU data centers", pt: "Armazenamento criptografado em centros de dados UE", fr: "Stockage chiffré dans des centres de données UE" },
};

function Marquee() {
  return (
    <div className="relative overflow-hidden py-8">
      <div className="absolute left-0 top-0 bottom-0 z-10 w-24 bg-gradient-to-r from-[#09090B] to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 z-10 w-24 bg-gradient-to-l from-[#09090B] to-transparent" />
      <div className="flex animate-marquee gap-8">
        {[...INTEGRATIONS, ...INTEGRATIONS].map(({ icon: Icon, name }, i) => (
          <div
            key={`${name}-${i}`}
            className="flex shrink-0 items-center gap-2.5 rounded-full border border-zinc-800/40 bg-zinc-900/40 px-5 py-2.5"
          >
            <Icon className="size-4 text-zinc-500" />
            <span className="text-sm text-zinc-400 whitespace-nowrap">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Integrations() {
  const { ref, inView } = useInView();
  const { t, dict } = useLandingT();

  return (
    <section id="integraciones" className="relative bg-[#09090B] py-32" ref={ref}>
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-sm font-medium tracking-wider text-emerald-400/80 uppercase">
            {t(dict.integrations.label)}
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            {t(dict.integrations.title)}
          </h2>
        </motion.div>

        <Marquee />

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {INTEGRATIONS.map(({ icon: Icon, name }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.06 }}
              className="group rounded-xl border border-zinc-800/40 bg-zinc-900/20 p-5 transition-colors hover:border-zinc-700/60"
            >
              <Icon className="mb-3 size-5 text-zinc-600 transition-colors group-hover:text-emerald-400" />
              <h3 className="mb-1 text-sm font-semibold text-white">{name}</h3>
              <p className="text-xs leading-relaxed text-zinc-600">{DESCS[name] ? t(DESCS[name]) : ""}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
