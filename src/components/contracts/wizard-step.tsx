"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Wizard step indicator for contract creation (F-3.3).
 *
 * Shows step number, title, and completion status.
 */
export interface WizardStepProps {
  steps: Array<{ title: string; description?: string }>;
  currentStep: number;
}

export function WizardSteps({ steps, currentStep }: WizardStepProps) {
  return (
    <nav aria-label="Pasos del wizard" className="mb-8">
      <ol className="flex items-center gap-2">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          return (
            <li key={idx} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  isCompleted &&
                    "border-primary bg-primary text-primary-foreground",
                  isCurrent &&
                    "border-primary bg-background text-primary",
                  !isCompleted &&
                    !isCurrent &&
                    "border-border bg-background text-muted-foreground",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isCompleted ? (
                  <Check className="size-4" aria-hidden />
                ) : (
                  idx + 1
                )}
              </div>
              <div className="hidden min-w-0 flex-1 sm:block">
                <p
                  className={cn(
                    "truncate text-sm font-medium",
                    isCurrent ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className="truncate text-xs text-muted-foreground">
                    {step.description}
                  </p>
                )}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "hidden h-0.5 flex-1 sm:block",
                    isCompleted ? "bg-primary" : "bg-border",
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
