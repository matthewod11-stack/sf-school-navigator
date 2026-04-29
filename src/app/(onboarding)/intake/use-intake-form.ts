"use client";

import { useState, useEffect, useCallback } from "react";
import type { IntakeData } from "@/types/api";

const STORAGE_KEY = "sf-school-nav-intake";

const defaultData: IntakeData = {
  step1: {
    childLabel: "Child 1",
    childDob: null,
    childExpectedDueDate: null,
    gradeTarget: "prek",
    pottyTrained: null,
    hasSpecialNeeds: null,
    hasMultiples: false,
    numChildren: 1,
  },
  step2: {
    homeAddress: "",
  },
  step3: {
    budgetMonthlyMax: null,
    subsidyInterested: false,
    scheduleDaysNeeded: null,
    scheduleHoursNeeded: null,
    startDate: null,
  },
  step4: {
    philosophy: [],
    languages: [],
    mustHaves: [],
    niceToHaves: [],
  },
};

function readStoredIntake(): { currentStep: number; data: IntakeData } {
  if (typeof window === "undefined") {
    return { currentStep: 1, data: defaultData };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { currentStep: 1, data: defaultData };
    }

    const parsed = JSON.parse(stored) as {
      currentStep?: number;
      data?: IntakeData;
    };

    const storedData = parsed.data ?? defaultData;
    return {
      currentStep: parsed.currentStep ?? 1,
      data: {
        step1: { ...defaultData.step1, ...storedData.step1 },
        step2: { ...defaultData.step2, ...storedData.step2 },
        step3: { ...defaultData.step3, ...storedData.step3 },
        step4: { ...defaultData.step4, ...storedData.step4 },
      },
    };
  } catch {
    return { currentStep: 1, data: defaultData };
  }
}

export function useIntakeForm() {
  const [initial] = useState(readStoredIntake);
  const [currentStep, setCurrentStep] = useState(initial.currentStep);
  const [data, setData] = useState<IntakeData>(initial.data);

  // Save to localStorage on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      // Privacy: do not persist exact home address in localStorage.
      const sanitizedData: IntakeData = {
        ...data,
        step2: { ...data.step2, homeAddress: "" },
      };
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ currentStep, data: sanitizedData })
      );
    } catch {
      // Ignore storage errors
    }
  }, [currentStep, data]);

  const updateStep = useCallback(
    <K extends keyof IntakeData>(step: K, values: Partial<IntakeData[K]>) => {
      setData((prev) => ({
        ...prev,
        [step]: { ...prev[step], ...values },
      }));
    },
    []
  );

  const nextStep = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, 5));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(1, Math.min(step, 5)));
  }, []);

  const reset = useCallback(() => {
    setData(defaultData);
    setCurrentStep(1);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    currentStep,
    data,
    loaded: true,
    updateStep,
    nextStep,
    prevStep,
    goToStep,
    reset,
  };
}
