"use client";

import { useId } from "react";

interface EducationTooltipProps {
  label: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

export function EducationTooltip({
  label,
  description,
  children,
  className = "",
}: EducationTooltipProps) {
  const id = useId();

  return (
    <span className={`group relative inline-flex ${className}`}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={id}
        onClick={(event) => event.stopPropagation()}
        className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700 focus-visible:ring-offset-2"
      >
        {children}
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-64 rounded-md border border-neutral-200 bg-white p-3 text-left text-xs leading-relaxed text-neutral-700 shadow-lg group-focus-within:block group-hover:block"
      >
        {description}
      </span>
    </span>
  );
}
