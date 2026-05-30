"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, MessageSquare, RefreshCw, Shield } from "lucide-react";
import { useInView } from "./use-in-view";
import { useLandingT } from "./i18n";

const CHAT_MESSAGES = [
  { role: "user" as const, text: "Hola, me interesa cambiar de comercializadora. Mi CUPS es ES0021..." },
  { role: "ai" as const, text: "He consultado tu punto de suministro. Tienes contratada una 2.0TD con 4.6kW en las 3 potencias. Tu consumo anual es de 3.200 kWh. Con nuestra tarifa fija ahorras un 18% — unos 142 EUR/ano. Quieres que prepare una oferta?" },
  { role: "user" as const, text: "Si, adelante" },
  { role: "ai" as const, text: "Oferta generada. Te envio el contrato para firma digital. Necesito tu consentimiento para iniciar el cambio de comercializador (C1). Confirmas?" },
] as const;

function ChatMockup() {
  const { ref, inView } = useInView(0.3);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    setVisibleCount(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    CHAT_MESSAGES.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), 600 + i * 1200));
    });
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-zinc-800/40 px-4 py-3">
          <div className="flex size-7 items-center justify-center rounded-full bg-violet-500/20">
            <Brain className="size-3.5 text-violet-400" />
          </div>
          <div>
            <span className="text-sm font-medium text-white">Lead Concierge</span>
            <span className="ml-2 text-[10px] text-emerald-400">online</span>
          </div>
        </div>
        <div className="flex min-h-[280px] flex-col gap-3 p-4">
          <AnimatePresence>
            {CHAT_MESSAGES.slice(0, visibleCount).map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${msg.role === "user" ? "bg-emerald-500/15 text-emerald-100 rounded-br-md" : "bg-zinc-800/60 text-zinc-300 rounded-bl-md"}`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {visibleCount > 0 && visibleCount < CHAT_MESSAGES.length && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1 px-4 py-2">
              {[0, 1, 2].map((d) => (
                <motion.div key={d} className="size-1.5 rounded-full bg-zinc-600" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: d * 0.2 }} />
              ))}
            </motion.div>
          )}
        </div>
      </div>
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-violet-500/5 blur-2xl" />
    </div>
  );
}

const FEATURE_ICONS = [MessageSquare, RefreshCw, Shield] as typeof MessageSquare[];

export function AISection() {
  const { ref, inView } = useInView();
  const { t, dict } = useLandingT();

  return (
    <section id="ia" className="relative overflow-hidden bg-[#09090B] py-32" ref={ref}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(139,92,246,0.06),transparent)]" />
      </div>
      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-400">
            <Brain className="size-3" />
            {t(dict.ai.badge)}
          </span>
          <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-bold tracking-tight text-white md:text-4xl">
            {t(dict.ai.title)} <span className="text-zinc-500">{t(dict.ai.titleFaded)}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-500">{t(dict.ai.sub)}</p>
        </motion.div>

        <div className="mt-20 grid items-center gap-16 lg:grid-cols-2">
          <div className="space-y-8">
            {dict.ai.features.map((feat, i) => {
              const Icon = FEATURE_ICONS[i]!;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }} className="group flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 transition-colors group-hover:border-violet-500/40">
                    <Icon className="size-4.5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-base font-semibold text-white">{t(feat.title)}</h3>
                    <p className="text-sm leading-relaxed text-zinc-500">{t(feat.desc)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <motion.div initial={{ opacity: 0, x: 30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.4 }}>
            <ChatMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
