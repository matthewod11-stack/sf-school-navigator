"use client";

import { useMemo } from "react";
import { useIntakeForm } from "./use-intake-form";
import { ProgressBar } from "./progress-bar";
import { StepChild } from "./step-child";
import { StepLocation } from "./step-location";
import { StepSchedule } from "./step-schedule";
import { StepPreferences } from "./step-preferences";
import { StepReview } from "./step-review";
import { Skeleton } from "@/components/ui/skeleton";

export function IntakeWizard() {
  const {
    currentStep,
    data,
    loaded,
    updateStep,
    nextStep,
    prevStep,
    goToStep,
  } = useIntakeForm();

  // Track which steps the user has advanced past
  const completedSteps = useMemo(() => {
    const completed = new Set<number>();
    for (let i = 1; i < currentStep; i++) {
      completed.add(i);
    }
    return completed;
  }, [currentStep]);

  if (!loaded) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-10 w-32 ml-auto" />
      </div>
    );
  }

  return (
    <>
      <ProgressBar
        currentStep={currentStep}
        onStepClick={goToStep}
        completedSteps={completedSteps}
      />

      {currentStep === 1 && (
        <StepChild
          data={data.step1}
          onUpdate={(values) => updateStep("step1", values)}
          onNext={nextStep}
        />
      )}
      {currentStep === 2 && (
        <StepLocation
          data={data.step2}
          onUpdate={(values) => updateStep("step2", values)}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      {currentStep === 3 && (
        <StepSchedule
          data={data.step3}
          onUpdate={(values) => updateStep("step3", values)}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      {currentStep === 4 && (
        <StepPreferences
          data={data.step4}
          onUpdate={(values) => updateStep("step4", values)}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      {currentStep === 5 && (
        <StepReview data={data} onBack={prevStep} onEdit={goToStep} />
      )}
    </>
  );
}
