import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  getAllStaticPages,
  getLanguagePages,
  findPageBySlug,
  type SeoPageConfig,
} from "@/lib/seo/pages";
import {
  getProgramsForSeoPage,
  getLanguagesWithMinPrograms,
  type SeoProgram,
} from "@/lib/seo/queries";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-static";
export const dynamicParams = false;

async function resolvePageConfig(
  slug: string
): Promise<SeoPageConfig | undefined> {
  let languagePages: SeoPageConfig[] = [];
  try {
    const languages = await getLanguagesWithMinPrograms(3);
    languagePages = getLanguagePages(languages);
  } catch {
    // Build/runtime fallback when language aggregation is unavailable.
  }
  return findPageBySlug(slug, languagePages);
}

export async function generateStaticParams() {
  const staticPages = getAllStaticPages();
  let languagePages: SeoPageConfig[] = [];

  try {
    const languages = await getLanguagesWithMinPrograms(3);
    languagePages = getLanguagePages(languages);
  } catch {
    // Build-time: language query may fail if DB is unavailable
  }

  return [...staticPages, ...languagePages].map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = await resolvePageConfig(slug);

  if (!config) {
    return { title: "Not Found" };
  }

  return {
    title: config.title,
    description: config.description,
    openGraph: {
      title: config.title,
      description: config.description,
      type: "website",
    },
  };
}

const TYPE_LABELS: Record<string, string> = {
  center: "Center",
  "family-home": "Family Home",
  "sfusd-prek": "SFUSD Pre-K",
  "sfusd-tk": "SFUSD TK",
  "head-start": "Head Start",
  montessori: "Montessori",
  waldorf: "Waldorf",
  religious: "Religious",
  "co-op": "Co-op",
  other: "Other",
};

function formatCost(program: SeoProgram): string {
  if (program.monthlyCostLow === null) return "Contact for pricing";
  if (
    program.monthlyCostHigh !== null &&
    program.monthlyCostHigh !== program.monthlyCostLow
  ) {
    return `$${program.monthlyCostLow.toLocaleString()}-$${program.monthlyCostHigh.toLocaleString()}/mo`;
  }
  return `$${program.monthlyCostLow.toLocaleString()}/mo`;
}

function formatAgeRange(program: SeoProgram): string {
  if (program.ageMinMonths === null) return "";
  const minYears = Math.floor(program.ageMinMonths / 12);
  const minMonths = program.ageMinMonths % 12;
  let range = minMonths > 0 ? `${minYears}y ${minMonths}m` : `${minYears}y`;

  if (program.ageMaxMonths !== null) {
    const maxYears = Math.floor(program.ageMaxMonths / 12);
    const maxMonths = program.ageMaxMonths % 12;
    range += " - ";
    range += maxMonths > 0 ? `${maxYears}y ${maxMonths}m` : `${maxYears}y`;
  }
  return range;
}

export default async function SeoPage({ params }: PageProps) {
  const { slug } = await params;
  const config = await resolvePageConfig(slug);

  if (!config) {
    notFound();
  }

  let programs: SeoProgram[] = [];
  try {
    programs = await getProgramsForSeoPage(config);
  } catch {
    // Keep page renderable if data source is temporarily unavailable.
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          {config.heading}
        </h1>
        <p className="mt-3 text-lg text-neutral-600">{config.description}</p>

        {/* CTA */}
        <div className="mt-6 flex gap-3">
          <Link href="/intake">
            <Button>Get Personalized Matches</Button>
          </Link>
          <Link href="/search">
            <Button variant="secondary">Browse All Programs</Button>
          </Link>
        </div>

        {/* Program List */}
        <div className="mt-10">
          <h2 className="font-serif text-xl font-semibold text-neutral-900">
            {programs.length} Program{programs.length !== 1 ? "s" : ""} Found
          </h2>

          {programs.length === 0 ? (
            <p className="mt-4 text-neutral-500">
              No programs currently match this filter. Try browsing all programs
              or adjusting your search.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {programs.map((program) => (
                <Link
                  key={program.id}
                  href={`/programs/${program.slug}`}
                  className="block rounded-md border border-neutral-200 bg-white px-4 py-4 transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif font-semibold text-neutral-900">
                        {program.name}
                      </h3>
                      {program.address && (
                        <p className="mt-0.5 text-sm text-neutral-500">
                          {program.address}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
                        <span>
                          {TYPE_LABELS[program.primaryType] ??
                            program.primaryType}
                        </span>
                        {formatAgeRange(program) && (
                          <span>Ages: {formatAgeRange(program)}</span>
                        )}
                        <span>{formatCost(program)}</span>
                        {program.languages.length > 0 && (
                          <span>{program.languages.join(", ")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 rounded-lg bg-neutral-900 p-6 text-center">
          <h2 className="font-serif text-lg font-semibold text-white">
            Not sure where to start?
          </h2>
          <p className="mt-1 text-neutral-300">
            Tell us about your family and we will match you with the best
            programs.
          </p>
          <Link href="/intake" className="mt-4 inline-block">
            <Button>Start Free Matching</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
