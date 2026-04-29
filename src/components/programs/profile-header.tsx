import { Badge } from "@/components/ui/badge";
import { EducationTooltip } from "@/components/education/education-tooltip";
import type { ProgramWithDetails } from "@/types/domain";
import { SEARCH_PROFILE_EDUCATION } from "@/lib/content/education";
import { formatGradeLevels, isElementaryProgramType, PROGRAM_TYPE_LABELS } from "@/lib/program-types";

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
        <Badge color="gray">{PROGRAM_TYPE_LABELS[program.primaryType]}</Badge>
        {program.gradeLevels.length > 0 && (
          <EducationTooltip
            label="What grade labels mean"
            description={SEARCH_PROFILE_EDUCATION.gradeLevels}
          >
            <Badge color="gray">{formatGradeLevels(program.gradeLevels)}</Badge>
          </EducationTooltip>
        )}
        {program.primaryType.startsWith("sfusd-") && !isElementaryProgramType(program.primaryType) && (
          <EducationTooltip
            label="What K-path means"
            description={SEARCH_PROFILE_EDUCATION.kPath}
          >
            <Badge color="blue">K-path</Badge>
          </EducationTooltip>
        )}
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
