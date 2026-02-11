"use client";

const steps = [
  { num: 1, label: "Child" },
  { num: 2, label: "Location" },
  { num: 3, label: "Schedule" },
  { num: 4, label: "Preferences" },
  { num: 5, label: "Review" },
];

interface ProgressBarProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  completedSteps: Set<number>;
}

export function ProgressBar({
  currentStep,
  onStepClick,
  completedSteps,
}: ProgressBarProps) {
  return (
    <nav aria-label="Intake progress" className="mb-8">
      <ol className="flex items-center gap-2">
        {steps.map((step, i) => {
          const isActive = step.num === currentStep;
          const isComplete = completedSteps.has(step.num);
          const isClickable = isComplete || step.num <= currentStep;

          return (
            <li key={step.num} className="flex items-center gap-2 flex-1">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => onStepClick(step.num)}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-600 text-white"
                    : isComplete
                      ? "bg-brand-100 text-brand-700"
                      : "bg-neutral-100 text-neutral-400"
                } ${isClickable ? "cursor-pointer hover:ring-2 hover:ring-brand-300" : "cursor-default"}`}
                aria-current={isActive ? "step" : undefined}
              >
                {isComplete && !isActive ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                ) : (
                  step.num
                )}
              </button>
              <span
                className={`hidden text-xs sm:inline ${
                  isActive
                    ? "font-medium text-neutral-900"
                    : "text-neutral-500"
                }`}
              >
                {step.label}
              </span>
              {i < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${
                    completedSteps.has(step.num)
                      ? "bg-brand-300"
                      : "bg-neutral-200"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
