import { Badge } from "@/components/ui/badge";
import type { ProgramWithDetails } from "@/types/domain";

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

function formatAgeRange(minMonths: number | null, maxMonths: number | null): string | null {
  if (minMonths == null && maxMonths == null) return null;
  function fmt(value: number): string {
    if (value < 12) return `${value} months`;
    if (value % 12 === 0) return `${value / 12} years`;
    return `${(value / 12).toFixed(1)} years`;
  }
  if (minMonths != null && maxMonths != null) return `${fmt(minMonths)} - ${fmt(maxMonths)}`;
  if (minMonths != null) return `${fmt(minMonths)}+`;
  return `Up to ${fmt(maxMonths!)}`;
}

interface ProfileHeaderProps {
  program: ProgramWithDetails;
}

export function ProfileHeader({ program }: ProfileHeaderProps) {
  const ageRange = formatAgeRange(program.ageMinMonths, program.ageMaxMonths);

  return (
    <div>
      <div className="flex flex-wrap items-start gap-3">
        <Badge color="gray">{TYPE_LABELS[program.primaryType] ?? program.primaryType}</Badge>
        {program.languages.map((l) => (
          <Badge key={l.language} color="blue">
            {l.language}
            {l.immersionType !== "exposure" && ` (${l.immersionType})`}
          </Badge>
        ))}
        {program.tags.map((t) => (
          <Badge key={t.tag} color="green">
            {t.tag}
          </Badge>
        ))}
      </div>

      <h1 className="mt-3 font-serif text-2xl font-bold text-neutral-900 sm:text-3xl">
        {program.name}
      </h1>

      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-600">
        {program.address && <span>{program.address}</span>}
        {program.phone && <span>{program.phone}</span>}
      </div>

      {ageRange && (
        <p className="mt-2 text-sm text-neutral-500">
          Ages: {ageRange}
          {program.pottyTrainingRequired && " (potty training required)"}
        </p>
      )}

      {program.website && (
        <a
          href={program.website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-brand-700 hover:text-brand-800 hover:underline"
        >
          Visit website
        </a>
      )}

      {program.licenseNumber && (
        <p className="mt-1 text-xs text-neutral-400">
          License #{program.licenseNumber}
          {program.licenseStatus && ` — ${program.licenseStatus}`}
        </p>
      )}
    </div>
  );
}
