"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { useInView } from "./use-in-view";

const PLANS = [
  {
    name: "Starter",
    price: "299",
    desc: "Para comercializadoras que empiezan",
    features: [
      "Hasta 5.000 CUPS",
      "3 usuarios",
      "Leads, pipeline, CUPS, contratos",
      "ATR automatizado (C1, A3, B1)",
      "Soporte email",
    ],
    cta: "Empezar 14 dias gratis",
    featured: false,
  },
  {
    name: "Professional",
    price: "799",
    desc: "Todo lo que necesitas para escalar",
    features: [
      "Hasta 50.000 CUPS",
      "15 usuarios",
      "Todos los modulos",
      "Agentes IA incluidos",
      "Portal cliente con tu marca",
      "App movil iOS y Android",
      "Soporte prioritario",
    ],
    cta: "Solicitar demo",
    featured: true,
    badge: "Mas popular",
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "Para grandes comercializadoras",
    features: [
      "CUPS ilimitados",
      "Usuarios ilimitados",
      "Todo lo de Professional",
      "SLA garantizado",
      "Onboarding dedicado",
      "API access completo",
      "Marca blanca total",
    ],
    cta: "Hablar con ventas",
    featured: false,
  },
] as const;

export function Pricing() {
  const { ref, inView } = useInView();

  return (
    <section id="precios" className="relative bg-[#09090B] py-32" ref={ref}>
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-sm font-medium tracking-wider text-emerald-400/80 uppercase">
            Precios
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Simple, transparente, sin sorpresas
          </h2>
          <p className="mx-auto mt-4 max-w-md text-zinc-500">
            Sin licencia inicial. Sin permanencia. Tus datos siempre exportables.
          </p>
        </motion.div>

        <div className="mt-16 grid items-start gap-4 lg:grid-cols-3">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
              className={`relative rounded-2xl border p-7 ${
                plan.featured
                  ? "border-emerald-500/30 bg-emerald-500/[0.03]"
                  : "border-zinc-800/60 bg-zinc-900/20"
              }`}
            >
              {plan.featured && "badge" in plan && (
                <>
                  <div className="absolute -inset-px -z-10 rounded-2xl bg-gradient-to-b from-emerald-500/20 via-transparent to-cyan-500/10 blur-xl" />
                  <span className="absolute -top-3 left-6 rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-semibold text-white">
                    {plan.badge}
                  </span>
                </>
              )}

              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <p className="mt-1 text-sm text-zinc-500">{plan.desc}</p>

              <div className="mt-6 flex items-baseline gap-1">
                {plan.price === "Custom" ? (
                  <span className="text-3xl font-bold text-white">A medida</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-sm text-zinc-500">EUR/mes</span>
                  </>
                )}
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className={`mt-0.5 size-4 shrink-0 ${plan.featured ? "text-emerald-400" : "text-zinc-600"}`} />
                    <span className="text-sm text-zinc-400">{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#demo"
                className={`mt-8 flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all ${
                  plan.featured
                    ? "bg-white text-zinc-900 hover:shadow-[0_0_24px_rgba(16,185,129,0.3)]"
                    : "border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white"
                }`}
              >
                {plan.cta}
                <ArrowRight className="size-3.5" />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
