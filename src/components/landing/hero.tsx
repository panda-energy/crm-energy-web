"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { useReducedMotion } from "./use-reduced-motion";
import { useLandingT } from "./i18n";

function GradientMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduced) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 0.5;
      canvas.height = canvas.offsetHeight * 0.5;
    };
    resize();
    window.addEventListener("resize", resize);

    const blobs = [
      { x: 0.3, y: 0.3, r: 0.35, color: [16, 185, 129] },
      { x: 0.7, y: 0.6, r: 0.3, color: [6, 182, 212] },
      { x: 0.5, y: 0.8, r: 0.25, color: [139, 92, 246] },
    ];

    const draw = () => {
      t += 0.003;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (const blob of blobs) {
        const bx = (blob.x + Math.sin(t + blob.x * 10) * 0.08) * w;
        const by = (blob.y + Math.cos(t * 0.7 + blob.y * 10) * 0.08) * h;
        const br = blob.r * Math.min(w, h);

        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        grad.addColorStop(0, `rgba(${blob.color.join(",")}, 0.15)`);
        grad.addColorStop(1, `rgba(${blob.color.join(",")}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      frame = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 size-full"
      style={{ filter: "blur(80px)" }}
      aria-hidden="true"
    />
  );
}

function GridPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 60% 50% at 50% 40%, black 30%, transparent 70%)",
        }}
      />
    </div>
  );
}

export function Hero() {
  const { t, dict } = useLandingT();
  const headline = t(dict.hero.headline);
  const aiWord = t(dict.hero.aiWord);
  const words = headline.split(" ");

  return (
    <section className="relative flex min-h-[100dvh] items-center overflow-hidden bg-[#09090B]">
      <GradientMesh />
      <GridPattern />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-20 pt-32">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-400">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
              </span>
              {t(dict.hero.badge)}
            </span>
          </motion.div>

          <h1 className="mt-8 text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.08] tracking-tight text-white">
            {words.map((word, i) => (
              <motion.span
                key={`${word}-${i}`}
                initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.5,
                  delay: 0.4 + i * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="mr-[0.3em] inline-block"
              >
                {word === aiWord || word === "IA" || word === "AI-powered" ? (
                  <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                    {word}
                  </span>
                ) : (
                  word
                )}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl"
          >
            {t(dict.hero.sub)}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.5 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <a
              href="#demo"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-zinc-900 transition-all hover:shadow-[0_0_32px_rgba(16,185,129,0.3)]"
            >
              <span className="relative z-10">{t(dict.hero.cta1)}</span>
              <ArrowRight className="relative z-10 size-4 transition-transform group-hover:translate-x-0.5" />
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-emerald-200/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </a>
            <a
              href="#producto"
              className="group inline-flex items-center gap-2 rounded-full border border-zinc-800 px-7 py-3.5 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:text-white"
            >
              <Play className="size-3.5 fill-current" />
              {t(dict.hero.cta2)}
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 2 }}
            className="mt-16 flex flex-wrap gap-x-10 gap-y-4 border-t border-zinc-800/60 pt-8"
          >
            {[
              { value: "5", label: t(dict.hero.stats.distributors) },
              { value: "<1s", label: t(dict.hero.stats.latency) },
              { value: "99.5%", label: t(dict.hero.stats.uptime) },
              { value: "RGPD", label: t(dict.hero.stats.rgpd) },
            ].map(({ value, label }) => (
              <div key={label} className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{value}</span>
                <span className="text-sm text-zinc-500">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 60, rotateY: -12 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ duration: 1, delay: 1.8, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute -right-12 top-1/2 hidden -translate-y-1/2 xl:block"
          style={{ perspective: "1200px" }}
        >
          <div className="relative w-[520px] rounded-2xl border border-zinc-800/60 bg-zinc-900/80 p-1 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-1.5 px-4 py-3">
              <div className="size-2.5 rounded-full bg-zinc-700" />
              <div className="size-2.5 rounded-full bg-zinc-700" />
              <div className="size-2.5 rounded-full bg-zinc-700" />
              <span className="ml-3 text-xs text-zinc-600">kuro.energy/dashboard</span>
            </div>
            <div className="rounded-xl bg-zinc-950 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="h-3 w-24 rounded bg-zinc-800" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 rounded bg-emerald-500/20" />
                  <div className="h-6 w-16 rounded bg-zinc-800" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg bg-zinc-900 p-3">
                    <div className="mb-2 h-2 w-12 rounded bg-zinc-800" />
                    <div className="h-4 w-10 rounded bg-zinc-700" />
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {["emerald", "cyan", "violet", "amber"].map((c, col) => (
                  <div key={c} className="space-y-2">
                    <div className={`h-1 rounded-full ${
                      c === "emerald" ? "bg-emerald-500/40" :
                      c === "cyan" ? "bg-cyan-500/40" :
                      c === "violet" ? "bg-violet-500/40" :
                      "bg-amber-500/40"
                    }`} />
                    {Array.from({ length: col === 0 ? 3 : col === 1 ? 2 : col === 2 ? 3 : 1 }).map((_, j) => (
                      <div key={j} className="rounded-md bg-zinc-900 p-2">
                        <div className="mb-1.5 h-2 w-full rounded bg-zinc-800" />
                        <div className="h-2 w-2/3 rounded bg-zinc-800/50" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -inset-px -z-10 rounded-2xl bg-gradient-to-b from-emerald-500/10 via-transparent to-cyan-500/10 blur-xl" />
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#09090B] to-transparent" />
    </section>
  );
}
