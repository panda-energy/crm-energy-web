import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Zustand store for onboarding tour state.
 * Persisted to localStorage so the tour only shows once.
 */
interface OnboardingState {
  completed: boolean;
  currentStep: number;
  isActive: boolean;
  markCompleted: () => void;
  startTour: () => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetTour: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      completed: false,
      currentStep: 0,
      isActive: false,
      markCompleted: () => set({ completed: true, isActive: false, currentStep: 0 }),
      startTour: () => set({ isActive: true, currentStep: 0 }),
      stopTour: () => set({ isActive: false }),
      nextStep: () => set((s) => ({ currentStep: s.currentStep + 1 })),
      prevStep: () =>
        set((s) => ({ currentStep: Math.max(0, s.currentStep - 1) })),
      goToStep: (step) => set({ currentStep: step }),
      resetTour: () => set({ completed: false, isActive: true, currentStep: 0 }),
    }),
    {
      name: "panda-onboarding",
      partialize: (state) => ({ completed: state.completed }),
    },
  ),
);
