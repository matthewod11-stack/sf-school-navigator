import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProgramBySlug, getProgramProvenance, getAttendanceAreaName } from "@/lib/db/queries/programs";
import { ProfileHeader } from "@/components/programs/profile-header";
import { CostSection } from "@/components/programs/cost-section";
import { ScheduleSection } from "@/components/programs/schedule-section";
import { AboutSection } from "@/components/programs/about-section";
import { ApplicationSection } from "@/components/programs/application-section";
import { SfusdSection } from "@/components/programs/sfusd-section";
import { ProvenanceTooltip } from "@/components/programs/provenance-tooltip";
import { ProfileActions } from "@/components/programs/profile-actions";
import { LocationSection } from "@/components/programs/location-section";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  if (!program) {
    return { title: "Program Not Found | SF School Navigator" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const canonicalUrl = `${siteUrl}/programs/${program.slug}`;
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const fallbackOgImage =
    program.coordinates && mapboxToken
      ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+3b82f6(${program.coordinates.lng.toFixed(5)},${program.coordinates.lat.toFixed(5)})/${program.coordinates.lng.toFixed(5)},${program.coordinates.lat.toFixed(5)},14/1200x630?access_token=${mapboxToken}`
      : null;
  const image = program.featuredImageUrl ?? fallbackOgImage;

  const description = [
    program.address,
    program.primaryType !== "other" ? program.primaryType.replace(/-/g, " ") : null,
    program.languages.length > 0 ? `Languages: ${program.languages.map((l) => l.language).join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(" — ");

  return {
    title: `${program.name} | SF School Navigator`,
    description: description || `Learn about ${program.name} on SF School Navigator.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${program.name} | SF School Navigator`,
      description: description || `Learn about ${program.name} on SF School Navigator.`,
      url: canonicalUrl,
      type: "article",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `${program.name} | SF School Navigator`,
      description: description || `Learn about ${program.name} on SF School Navigator.`,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProgramProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  if (!program) {
    notFound();
  }

  const [provenance, attendanceAreaName] = await Promise.all([
    getProgramProvenance(program.id),
    program.sfusdLinkage
      ? getAttendanceAreaName(program.sfusdLinkage.attendanceAreaId)
      : Promise.resolve(null),
  ]);

  const provenanceByField = provenance.reduce((map, item) => {
    if (!map.has(item.fieldName)) {
      map.set(item.fieldName, item);
    }
    return map;
  }, new Map<string, (typeof provenance)[number]>());

  const completenessPercent = Math.round(program.dataCompletenessScore);

  return (
    <div className="w-full">
      <nav className="mb-4 text-sm text-neutral-500">
        <Link href="/search" className="hover:text-brand-600">
          Search
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-900">{program.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          <ProfileHeader program={program} />

          {/* Data completeness indicator */}
          <div className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${completenessPercent}%` }}
              />
            </div>
            <span className="shrink-0 text-xs text-neutral-500">
              {completenessPercent}% profile complete
            </span>
          </div>

          <LocationSection
            address={program.address}
            coordinates={program.coordinates}
          />

          {/* Key details with provenance */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-neutral-900">Key Details</h2>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase text-neutral-400">Address</dt>
                  <dd className="mt-0.5 text-sm text-neutral-700">
                    <ProvenanceTooltip provenance={provenanceByField.get("address")}>
                      {program.address ?? <span className="italic text-neutral-400">Not yet verified</span>}
                    </ProvenanceTooltip>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-neutral-400">Phone</dt>
                  <dd className="mt-0.5 text-sm text-neutral-700">
                    <ProvenanceTooltip provenance={provenanceByField.get("phone")}>
                      {program.phone ?? <span className="italic text-neutral-400">Not yet verified</span>}
                    </ProvenanceTooltip>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-neutral-400">Ages</dt>
                  <dd className="mt-0.5 text-sm text-neutral-700">
                    <ProvenanceTooltip provenance={provenanceByField.get("age_min_months")}>
                      {program.ageMinMonths != null || program.ageMaxMonths != null
                        ? formatAgeDetail(program.ageMinMonths, program.ageMaxMonths)
                        : <span className="italic text-neutral-400">Not yet verified</span>}
                    </ProvenanceTooltip>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-neutral-400">License</dt>
                  <dd className="mt-0.5 text-sm text-neutral-700">
                    <ProvenanceTooltip provenance={provenanceByField.get("license_number")}>
                      {program.licenseNumber
                        ? `#${program.licenseNumber}${program.licenseStatus ? ` (${program.licenseStatus})` : ""}`
                        : <span className="italic text-neutral-400">Not yet verified</span>}
                    </ProvenanceTooltip>
                  </dd>
                </div>
                {program.pottyTrainingRequired != null && (
                  <div>
                    <dt className="text-xs font-medium uppercase text-neutral-400">Potty Training</dt>
                    <dd className="mt-0.5 text-sm text-neutral-700">
                      {program.pottyTrainingRequired ? "Required" : "Not required"}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <AboutSection program={program} />
          <ScheduleSection schedules={program.schedules} />
          <CostSection costs={program.costs} schedules={program.schedules} />
          <ApplicationSection deadlines={program.deadlines} website={program.website} />

          {program.sfusdLinkage && (
            <SfusdSection
              linkage={program.sfusdLinkage}
              attendanceAreaName={attendanceAreaName}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ProfileActions programId={program.id} programSlug={program.slug} programName={program.name} />

          {program.lastVerifiedAt && (
            <p className="text-xs text-neutral-400">
              Last verified{" "}
              {new Date(program.lastVerifiedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}

          <p className="text-xs text-neutral-400">
            Data source: {program.dataSource}
          </p>
        </div>
      </div>
    </div>
  );
}

function formatAgeDetail(minMonths: number | null, maxMonths: number | null): string {
  function fmt(value: number): string {
    if (value < 12) return `${value} months`;
    if (value % 12 === 0) return `${value / 12} years`;
    return `${(value / 12).toFixed(1)} years`;
  }
  if (minMonths != null && maxMonths != null) return `${fmt(minMonths)} - ${fmt(maxMonths)}`;
  if (minMonths != null) return `${fmt(minMonths)}+`;
  return `Up to ${fmt(maxMonths!)}`;
}
