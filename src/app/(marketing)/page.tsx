import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Personalized Matches",
    description:
      "Answer a few questions and get a curated list of programs tailored to your family.",
  },
  {
    title: "Map Explorer",
    description:
      "Browse programs on an interactive map with attendance area overlays.",
  },
  {
    title: "Side-by-Side Compare",
    description:
      "Compare schedules, costs, languages, and more across your top choices.",
  },
  {
    title: "Application Tracker",
    description:
      "Save programs, track deadlines, and stay on top of your applications.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-cream px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            Find the right preschool for your family
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-neutral-600 sm:text-xl">
            Navigate San Francisco&apos;s preschool landscape with confidence.
            Compare programs, explore neighborhoods, and track applications
            &mdash; all in one place.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/intake">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/search">
              <Button variant="secondary" size="lg">
                Browse Programs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-center text-2xl font-bold text-neutral-900 sm:text-3xl">
            Everything you need to choose with confidence
          </h2>
          <div className="mt-12 divide-y divide-rule">
            {features.map((feature) => (
              <div key={feature.title} className="py-6">
                <h3 className="font-serif text-lg font-semibold text-neutral-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-neutral-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-neutral-900 px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-serif text-2xl font-bold text-white sm:text-3xl">
            Ready to start your search?
          </h2>
          <p className="mt-3 text-neutral-300">
            It takes less than 2 minutes to tell us about your family. We&apos;ll
            do the rest.
          </p>
          <Link href="/intake" className="mt-6 inline-block">
            <Button
              variant="secondary"
              size="lg"
              className="border-white bg-white text-neutral-900 hover:bg-neutral-100"
            >
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
