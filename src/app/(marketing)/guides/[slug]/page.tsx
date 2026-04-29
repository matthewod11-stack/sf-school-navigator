import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getAllGuides, getGuideBySlug } from "@/lib/guides/guides";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllGuides().map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return { title: "Guide Not Found" };
  }

  return {
    title: guide.title,
    description: guide.description,
    openGraph: {
      title: `${guide.title} | SF School Navigator`,
      description: guide.description,
      type: "article",
    },
  };
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  return (
    <article className="bg-cream">
      <header className="border-b-2 border-neutral-900 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/guides"
            className="text-sm font-semibold text-brand-700 hover:text-brand-900"
          >
            All guides
          </Link>
          <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-neutral-900 sm:text-5xl">
            {guide.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-neutral-600">
            {guide.description}
          </p>
          <p className="mt-5 text-sm text-neutral-500">
            {guide.readTime} · {guide.updatedLabel}
          </p>
        </div>
      </header>

      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_18rem]">
          <div className="min-w-0">
            <section className="border-y border-rule py-6">
              <h2 className="font-serif text-xl font-bold text-neutral-900">
                Key takeaways
              </h2>
              <ul className="mt-4 space-y-3 text-neutral-700">
                {guide.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 flex-none rounded-full bg-brand-600" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="divide-y divide-rule">
              {guide.sections.map((section) => (
                <section key={section.heading} className="py-8">
                  <h2 className="font-serif text-2xl font-bold text-neutral-900">
                    {section.heading}
                  </h2>
                  <div className="mt-4 space-y-4 text-lg leading-relaxed text-neutral-700">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  {section.bullets && (
                    <ul className="mt-5 space-y-2 text-neutral-700">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-neutral-500" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border-y border-neutral-900 py-5">
              <h2 className="font-serif text-lg font-bold text-neutral-900">
                Next steps
              </h2>
              <div className="mt-4 space-y-3">
                {guide.relatedLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="block">
                    <Button
                      variant={link.href === "/intake" ? "primary" : "secondary"}
                      className="w-full"
                    >
                      {link.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6 border-b border-rule pb-5">
              <h2 className="font-serif text-lg font-bold text-neutral-900">
                Official sources
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {guide.sources.map((source) => (
                  <li key={source.href}>
                    <a
                      href={source.href}
                      className="font-semibold text-brand-700 hover:text-brand-900"
                      rel="noreferrer"
                      target="_blank"
                    >
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm leading-relaxed text-neutral-500">
                Dates and rules can change. Confirm deadlines and requirements
                with the official source before applying.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
