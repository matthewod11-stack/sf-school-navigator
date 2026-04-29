import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAllGuides } from "@/lib/guides/guides";

export const metadata: Metadata = {
  title: "Guides",
  description:
    "Plain-English guides for San Francisco preschool, TK, kindergarten, and elementary school planning.",
  openGraph: {
    title: "Guides | SF School Navigator",
    description:
      "Plain-English guides for San Francisco preschool, TK, kindergarten, and elementary school planning.",
    type: "website",
  },
};

const categoryLabels = {
  timeline: "Timeline",
  preschool: "Preschool",
  sfusd: "SFUSD",
  elementary: "Elementary",
} as const;

export default function GuidesIndexPage() {
  const guides = getAllGuides();

  return (
    <div className="bg-cream">
      <section className="border-b-2 border-neutral-900 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
            Parent guides
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-bold text-neutral-900 sm:text-5xl">
            Understand the school search before the deadlines arrive
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-neutral-600">
            Practical context for San Francisco preschool, TK, kindergarten, and
            elementary decisions. Use these guides alongside the matching tool,
            program search, and official district sources.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/intake">
              <Button size="lg">Get Personalized Matches</Button>
            </Link>
            <Link href="/search">
              <Button variant="secondary" size="lg">
                Browse Programs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="divide-y divide-rule border-y border-rule">
            {guides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="group grid gap-4 py-7 transition hover:bg-parchment sm:grid-cols-[10rem_1fr_auto] sm:items-start sm:px-3"
              >
                <div>
                  <span className="inline-flex rounded-sm border border-neutral-300 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600">
                    {categoryLabels[guide.category]}
                  </span>
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-bold text-neutral-900 group-hover:text-brand-700">
                    {guide.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-neutral-600">
                    {guide.description}
                  </p>
                  <p className="mt-3 text-sm text-neutral-500">
                    {guide.readTime} · {guide.updatedLabel}
                  </p>
                </div>
                <span className="text-sm font-semibold text-brand-700 sm:pt-2">
                  Read guide
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
