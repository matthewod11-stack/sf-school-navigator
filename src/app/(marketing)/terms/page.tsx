import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — SF School Navigator",
  description:
    "Terms of service for using SF School Navigator, a free informational tool for San Francisco parents.",
};

export default function TermsPage() {
  return (
    <div className="bg-cream px-4 py-16 sm:px-6 lg:px-8">
      <article className="prose-neutral mx-auto max-w-3xl">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Last updated: March 2026
        </p>

        <div className="mt-8 space-y-8 text-neutral-700 leading-relaxed">
          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-900">
              About This Tool
            </h2>
            <p className="mt-3">
              SF School Navigator is a free informational tool that helps San
              Francisco parents explore early childhood education options. It
              aggregates publicly available data about preschool and Pre-K
              programs to make the search process easier.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-900">
              Not Official Advice
            </h2>
            <p className="mt-3">
              This tool provides informational guidance, not official enrollment
              advice. SF School Navigator is not affiliated with, endorsed by, or
              operated by the San Francisco Unified School District (SFUSD), the
              San Francisco Department of Early Childhood, or any government
              agency.
            </p>
            <p className="mt-3">
              Information about SFUSD programs, attendance areas, enrollment
              policies, and kindergarten pathways is based on publicly available
              data and may not reflect the most current policies.{" "}
              <strong>
                Always verify enrollment information directly with SFUSD or the
                program in question.
              </strong>
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-900">
              Data Accuracy
            </h2>
            <p className="mt-3">
              Program information — including costs, schedules, languages,
              deadlines, and availability — is sourced from public datasets and
              program websites. While we make reasonable efforts to keep this
              data current, we cannot guarantee its accuracy.
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>
                Each program profile displays a &ldquo;last verified&rdquo; date
                so you know how fresh the data is.
              </li>
              <li>
                Costs, schedules, and availability can change without notice.
                Contact programs directly to confirm current information.
              </li>
              <li>
                Application deadlines are collected from public sources and may
                be estimates. Always confirm exact dates with the program.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-900">
              Match Scoring
            </h2>
            <p className="mt-3">
              Program match scores (Strong, Good, Partial) are calculated based
              on the preferences you provide during intake. They reflect how well
              a program&apos;s known attributes align with your stated needs —
              not a qualitative judgment about the program itself.
            </p>
            <p className="mt-3">
              Programs with incomplete data may receive lower match scores simply
              because we have less information to evaluate. A lower score does
              not mean a program is worse — it may mean we don&apos;t have
              enough data to assess it fully.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-900">
              Your Use of This Service
            </h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>You may use SF School Navigator for personal, non-commercial purposes.</li>
              <li>
                You are responsible for the accuracy of the information you
                provide during intake.
              </li>
              <li>
                Do not submit false correction reports or attempt to manipulate
                program data.
              </li>
              <li>
                We reserve the right to suspend accounts that abuse the service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-900">
              Email Communications
            </h2>
            <p className="mt-3">
              If you enable deadline reminders, we will send you email
              notifications about upcoming application deadlines for programs you
              have saved. Every email includes an unsubscribe link. You can also
              disable reminders from your dashboard at any time.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-900">
              Limitation of Liability
            </h2>
            <p className="mt-3">
              SF School Navigator is provided &ldquo;as is&rdquo; without
              warranty of any kind. We are not liable for decisions made based on
              information provided by this tool, including but not limited to
              enrollment decisions, application timing, or school selection.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-900">
              Changes to These Terms
            </h2>
            <p className="mt-3">
              We may update these terms from time to time. Continued use of the
              service after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-900">
              Contact
            </h2>
            <p className="mt-3">
              Questions about these terms? Reach us at{" "}
              <a
                href="mailto:hello@sfschoolnavigator.com"
                className="text-neutral-900 underline underline-offset-2"
              >
                hello@sfschoolnavigator.com
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
