"use client";

import { useState, useRef, useEffect, useId } from "react";
import type { FieldProvenance } from "@/types/domain";

const SOURCE_LABELS: Record<string, string> = {
  ccl: "CA Community Care Licensing",
  sfusd: "SFUSD",
  "website-scrape": "Program website",
  manual: "Manual entry",
  "user-correction": "User correction",
};

interface ProvenanceTooltipProps {
  provenance: FieldProvenance | undefined;
  children: React.ReactNode;
}

export function ProvenanceTooltip({ provenance, children }: ProvenanceTooltipProps) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!provenance) {
    return <>{children}</>;
  }

  function handleMouseEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  }

  function handleMouseLeave() {
    timeoutRef.current = setTimeout(() => setOpen(false), 200);
  }

  function openTooltip() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  }

  function closeTooltip() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(false);
  }

  return (
    <span
      className="relative inline-block cursor-help border-b border-dotted border-neutral-300"
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-describedby={open ? tooltipId : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={openTooltip}
      onBlur={closeTooltip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen((value) => !value);
        }
        if (e.key === "Escape") {
          closeTooltip();
        }
      }}
    >
      {children}
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-md border border-neutral-200 bg-white p-3 text-xs shadow-lg"
        >
          <span className="block font-medium text-neutral-700">
            Source: {SOURCE_LABELS[provenance.source] ?? provenance.source}
          </span>
          {provenance.rawSnippet && (
            <span className="mt-1 block text-neutral-500 italic">
              &ldquo;{provenance.rawSnippet}&rdquo;
            </span>
          )}
          <span className="mt-1 block text-neutral-400">
            Extracted{" "}
            {new Date(provenance.extractedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {provenance.verifiedAt && (
            <span className="block text-neutral-400">
              Verified{" "}
              {new Date(provenance.verifiedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
