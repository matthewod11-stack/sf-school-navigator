"use client";

import { useId, useState } from "react";
import Link from "next/link";
import type { IntakeEducationContent } from "@/lib/content/education";

interface EducationCalloutProps {
  content: IntakeEducationContent;
  className?: string;
}

export function EducationCallout({
  content,
  className = "",
}: EducationCalloutProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <section
      className={`rounded-md border border-rule bg-parchment ${className}`}
      aria-label={content.title}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="font-serif text-sm font-semibold text-neutral-900">
          {content.title}
        </span>
        <span className="text-sm font-semibold text-brand-700">
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open && (
        <div id={id} className="border-t border-rule px-4 py-3">
          <p className="text-sm leading-relaxed text-neutral-700">
            {content.body}
          </p>
          {content.link && (
            <Link
              href={content.link.href}
              className="mt-2 inline-block text-sm font-semibold text-brand-700 hover:text-brand-900"
            >
              {content.link.label}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
