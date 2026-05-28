"use client";

import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/lib/ui/onboarding-store";
import { cn } from "@/lib/utils/cn";

interface TourStep {
  title: string;
  description: string;
  /** CSS selector to highlight. Null = centered modal (first/last step). */
  targetSelector: string | null;
  /** Position of the tooltip relative to the target. */
  position: "bottom" | "right" | "left" | "top";
}

const TOUR_STEPS: ReadonlyArray<TourStep> = [
  {
    title: "Bienvenido a Panda Energy",
    description:
      "Tu CRM inteligente para gestionar la comercializacion de energia. Te guiaremos por las funciones principales.",
    targetSelector: null,
    position: "bottom",
  },
  {
    title: "Tus leads",
    description:
      "Gestiona tus contactos comerciales, filtra por estado y asigna propietarios.",
    targetSelector: 'a[href="/leads"]',
    position: "right",
  },
  {
    title: "Pipeline visual",
    description:
      "Visualiza tu embudo de ventas en modo Kanban, tabla o timeline. Arrastra leads entre etapas.",
    targetSelector: 'a[href="/pipeline"]',
    position: "right",
  },
  {
    title: "CUPS y datos SIPS",
    description:
      "Consulta puntos de suministro y recupera datos oficiales del SIPS automaticamente.",
    targetSelector: 'a[href="/cups"]',
    position: "right",
  },
  {
    title: "Crea contratos",
    description:
      "Wizard paso a paso: selecciona lead, CUPS, producto, cotiza y firma digitalmente.",
    targetSelector: 'a[href="/contracts"]',
    position: "right",
  },
  {
    title: "Chat IA",
    description:
      "Asistente inteligente que analiza tus datos y ejecuta acciones con tu aprobacion.",
    targetSelector: '[data-testid="ai-chat-trigger"]',
    position: "bottom",
  },
  {
    title: "Busca rapido",
    description:
      "Pulsa Cmd+K (o Ctrl+K) para buscar leads, ejecutar acciones y navegar al instante.",
    targetSelector: '[data-testid="cmdk-trigger"]',
    position: "bottom",
  },
  {
    title: "Configura tu cuenta",
    description:
      "Personaliza tu marca, gestiona tu equipo, productos e integraciones.",
    targetSelector: 'a[href="/settings"]',
    position: "right",
  },
];

/**
 * Onboarding tour overlay with 8 steps.
 * Shows on first login (unless localStorage has onboarding_completed).
 * Can be replayed from /settings.
 *
 * Implementation: a custom lightweight tour without external deps.
 * Uses a dark overlay with a highlight cutout over the target element.
 */
export function OnboardingTour() {
  const isActive = useOnboardingStore((s) => s.isActive);
  const completed = useOnboardingStore((s) => s.completed);
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const nextStep = useOnboardingStore((s) => s.nextStep);
  const prevStep = useOnboardingStore((s) => s.prevStep);
  const markCompleted = useOnboardingStore((s) => s.markCompleted);
  const stopTour = useOnboardingStore((s) => s.stopTour);
  const startTour = useOnboardingStore((s) => s.startTour);

  // Auto-start on first load if not completed
  useEffect(() => {
    if (!completed && !isActive) {
      // Delay to let the page render first
      const timer = setTimeout(() => startTour(), 1500);
      return () => clearTimeout(timer);
    }
  }, [completed, isActive, startTour]);

  const handleNext = useCallback(() => {
    if (currentStep >= TOUR_STEPS.length - 1) {
      markCompleted();
    } else {
      nextStep();
    }
  }, [currentStep, markCompleted, nextStep]);

  const handleSkip = useCallback(() => {
    markCompleted();
  }, [markCompleted]);

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStep];
  if (!step) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isCentered = step.targetSelector === null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
        aria-hidden="true"
      />

      {/* Tooltip */}
      <OnboardingTooltip
        step={step}
        stepIndex={currentStep}
        totalSteps={TOUR_STEPS.length}
        isCentered={isCentered}
        isFirst={isFirst}
        isLast={isLast}
        onNext={handleNext}
        onPrev={prevStep}
        onSkip={handleSkip}
        onClose={stopTour}
      />
    </>
  );
}

interface OnboardingTooltipProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  isCentered: boolean;
  isFirst: boolean;
  isLast: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onClose: () => void;
}

function OnboardingTooltip({
  step,
  stepIndex,
  totalSteps,
  isCentered,
  isFirst,
  isLast,
  onNext,
  onPrev,
  onSkip,
  onClose,
}: OnboardingTooltipProps) {
  if (isCentered) {
    return (
      <div
        role="dialog"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-desc"
        className="fixed left-1/2 top-1/2 z-[101] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-6 shadow-lg"
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Cerrar tour"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <div className="flex flex-col items-center gap-4 text-center">
          {isFirst ? (
            <div className="flex size-14 items-center justify-center rounded-xl bg-brand text-brand-foreground">
              <Zap className="size-7" aria-hidden="true" />
            </div>
          ) : null}
          <h2 id="onboarding-title" className="text-lg font-semibold text-foreground">
            {step.title}
          </h2>
          <p id="onboarding-desc" className="text-sm text-muted-foreground">
            {step.description}
          </p>
          <StepIndicator current={stepIndex} total={totalSteps} />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onSkip}>
              Saltar
            </Button>
            <Button size="sm" onClick={onNext}>
              {isLast ? "Empezar" : "Siguiente"}
              {!isLast ? (
                <ChevronRight className="ml-1 size-4" aria-hidden="true" />
              ) : null}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PositionedTooltip
      step={step}
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      isFirst={isFirst}
      isLast={isLast}
      onNext={onNext}
      onPrev={onPrev}
      onSkip={onSkip}
      onClose={onClose}
    />
  );
}

function PositionedTooltip({
  step,
  stepIndex,
  totalSteps,
  isFirst,
  isLast,
  onNext,
  onPrev,
  onSkip,
  onClose,
}: Omit<OnboardingTooltipProps, "isCentered">) {
  // Find element and position tooltip near it
  const target = step.targetSelector
    ? document.querySelector(step.targetSelector)
    : null;

  if (!target) {
    // Fallback to centered if target not found
    return (
      <div
        role="dialog"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-desc"
        className="fixed left-1/2 top-1/2 z-[101] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-5 shadow-lg"
      >
        <TooltipContent
          step={step}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          isFirst={isFirst}
          isLast={isLast}
          onNext={onNext}
          onPrev={onPrev}
          onSkip={onSkip}
          onClose={onClose}
        />
      </div>
    );
  }

  const rect = target.getBoundingClientRect();

  // Highlight the target by adding a ring
  const highlightStyle: React.CSSProperties = {
    position: "fixed",
    top: rect.top - 4,
    left: rect.left - 4,
    width: rect.width + 8,
    height: rect.height + 8,
    borderRadius: 8,
    border: "2px solid var(--brand)",
    boxShadow: "0 0 0 4px rgba(46, 125, 50, 0.2)",
    zIndex: 101,
    pointerEvents: "none",
  };

  // Position the tooltip
  const tooltipStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 101,
  };

  if (step.position === "right") {
    tooltipStyle.top = rect.top;
    tooltipStyle.left = rect.right + 16;
  } else if (step.position === "bottom") {
    tooltipStyle.top = rect.bottom + 16;
    tooltipStyle.left = Math.max(16, rect.left - 100);
  } else if (step.position === "left") {
    tooltipStyle.top = rect.top;
    tooltipStyle.right = window.innerWidth - rect.left + 16;
  } else {
    tooltipStyle.bottom = window.innerHeight - rect.top + 16;
    tooltipStyle.left = rect.left;
  }

  return (
    <>
      <div style={highlightStyle} aria-hidden="true" />
      <div
        role="dialog"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-desc"
        style={tooltipStyle}
        className="w-72 rounded-lg border border-border bg-surface p-4 shadow-lg"
      >
        <TooltipContent
          step={step}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          isFirst={isFirst}
          isLast={isLast}
          onNext={onNext}
          onPrev={onPrev}
          onSkip={onSkip}
          onClose={onClose}
        />
      </div>
    </>
  );
}

function TooltipContent({
  step,
  stepIndex,
  totalSteps,
  isFirst,
  isLast,
  onNext,
  onPrev,
  onSkip,
  onClose,
}: Omit<OnboardingTooltipProps, "isCentered">) {
  return (
    <>
      <button
        onClick={onClose}
        className="absolute right-2 top-2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Cerrar tour"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
      <h3 id="onboarding-title" className="pr-6 text-sm font-semibold text-foreground">
        {step.title}
      </h3>
      <p id="onboarding-desc" className="mt-1 text-xs text-muted-foreground">
        {step.description}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <StepIndicator current={stepIndex} total={totalSteps} />
        <div className="flex gap-1.5">
          {!isFirst ? (
            <Button variant="ghost" size="sm" onClick={onPrev} className="h-7 px-2 text-xs">
              <ChevronLeft className="mr-0.5 size-3" aria-hidden="true" />
              Anterior
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onSkip} className="h-7 px-2 text-xs">
              Saltar
            </Button>
          )}
          <Button size="sm" onClick={onNext} className="h-7 px-2 text-xs">
            {isLast ? "Hecho" : "Siguiente"}
            {!isLast ? (
              <ChevronRight className="ml-0.5 size-3" aria-hidden="true" />
            ) : null}
          </Button>
        </div>
      </div>
    </>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1" aria-label={`Paso ${current + 1} de ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "size-1.5 rounded-full transition-colors",
            i === current ? "bg-brand" : "bg-border",
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
