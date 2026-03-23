import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — SF School Navigator",
  description:
    "How SF School Navigator handles your data: what we collect, how we protect it, and your rights.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-cream px-4 py-16 sm:px-6 lg:px-8">
      <article className="prose-neutral mx-auto max-w-3xl">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Last updated: March 2026
        </p>

        <div className="mt-8 space-y-8 text-neutral-700 leading-relaxed">
          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-900">
              Our Principles
            </h2>
            <p className="mt-3">
              SF School Navigator is built with privacy at its core. We collect
              only what is needed to help you find the right preschool, and we
              go to significant lengths to protect your family&apos;s
              information.
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>We minimize data collection to what is strictly necessary for matching.</li>
              <li>We never store your home address — it is geocoded once and discarded.</li>
              <li>Your location is fuzzed by approximately 200 meters before storage.</li>
              <li>We store your child&apos;s age in months, not their date of birth.</li>
              <li>Special needs status is a simple yes/no flag — no free-text descriptions.</li>
              <li>We enforce row-level security on all personal data in our database.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-900">
              What We Collect
            </h2>
            <div className="mt-3 space-y-3">
              <p>
                <strong>Home address:</strong> Entered during the intake wizard,
                geocoded via Mapbox to determine your SFUSD attendance area, then
                immediately discarded. Only approximate coordinates (~200m
                offset) and attendance area ID are stored.
              </p>
              <p>
                <strong>Child information:</strong> Age in months, potty training
                status, and a boolean special needs flag. We do not store date of
                birth or any health-related text.
              </p>
              <p>
                <strong>Family preferences:</strong> Budget range, schedule
                needs, language preferences, and educational philosophy
                preferences. Stored as structured data — no free-text fields that
                could contain personal information.
              </p>
              <p>
                <strong>Saved programs:</strong> Which programs you have saved,
                your application status for each, and any notes you add.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-900">
              How We Protect Your Data
            </h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>
                <strong>Row-level security:</strong> Database policies ensure you
                can only access your own family&apos;s data. API routes verify
                ownership independently.
              </li>
              <li>
                <strong>No PII in logs:</strong> Query logging is configured to
                exclude parameters on family-related tables.
              </li>
              <li>
                <strong>Secure email links:</strong> Unsubscribe links use
                HMAC-signed, expiring tokens — not raw database IDs.
              </li>
              <li>
                <strong>HTTPS everywhere:</strong> All data in transit is
                encrypted.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-900">
              Your Rights
            </h2>
            <p className="mt-3">
              Under the California Consumer Privacy Act (CCPA), you have the
              right to:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>Request a copy of all data we hold about you and your family.</li>
              <li>Request deletion of your account and all associated data.</li>
              <li>Know that we do not sell personal information to third parties.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please contact us at the email
              address below.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-900">
              Children&apos;s Privacy (COPPA)
            </h2>
            <p className="mt-3">
              SF School Navigator does not collect information directly from
              children. All data is provided by parents or guardians. We store
              age in months rather than exact dates of birth to further minimize
              data about children.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-900">
              Program Data
            </h2>
            <p className="mt-3">
              Information about preschool programs (names, addresses, costs,
              schedules) is sourced from public datasets including California
              Community Care Licensing, SFUSD via DataSF, and program websites.
              This data is publicly accessible and is not personal information.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-bold text-neutral-900">
              Contact
            </h2>
            <p className="mt-3">
              Questions about this privacy policy or your data? Reach us at{" "}
              <a
                href="mailto:privacy@sfschoolnavigator.com"
                className="text-neutral-900 underline underline-offset-2"
              >
                privacy@sfschoolnavigator.com
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
