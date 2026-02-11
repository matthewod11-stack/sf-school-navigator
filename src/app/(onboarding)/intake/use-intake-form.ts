"use client";

import { useState, useEffect, useCallback } from "react";
import type { IntakeData } from "@/types/api";

const STORAGE_KEY = "sf-school-nav-intake";

const defaultData: IntakeData = {
  step1: {
    childDob: null,
    childExpectedDueDate: null,
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

export function useIntakeForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<IntakeData>(defaultData);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          currentStep?: number;
          data?: IntakeData;
        };
        if (parsed.data) setData(parsed.data);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
      }
    } catch {
      // Ignore parse errors
    }
    setLoaded(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ currentStep, data })
      );
    } catch {
      // Ignore storage errors
    }
  }, [currentStep, data, loaded]);

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
    loaded,
    updateStep,
    nextStep,
    prevStep,
    goToStep,
    reset,
  };
}
