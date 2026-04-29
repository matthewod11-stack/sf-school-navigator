import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { EducationTooltip } from "@/components/education/education-tooltip";
import { SFUSD_DISCLAIMER } from "@/lib/config/cities/sf";
import { SEARCH_PROFILE_EDUCATION } from "@/lib/content/education";
import type { ProgramSfusdLinkage } from "@/types/domain";
import type { SfusdRuleRow } from "@/lib/db/queries/programs";

interface SfusdSectionProps {
  linkage: ProgramSfusdLinkage;
  attendanceAreaName: string | null;
  rules: SfusdRuleRow[];
}

function buildPlainExplanation(
  linkage: ProgramSfusdLinkage,
  attendanceAreaName: string | null,
  rules: SfusdRuleRow[]
): string {
  const parts: string[] = [];

  if (linkage.tiebreakerEligible && attendanceAreaName) {
    parts.push(
      `Families living in the ${attendanceAreaName} attendance area may receive a tiebreaker advantage when applying to this program.`
    );
  } else if (attendanceAreaName) {
    parts.push(
      `This program is in the ${attendanceAreaName} attendance area.`
    );
  }

  if (linkage.feederElementarySchool) {
    parts.push(
      `Students may have a pathway to ${linkage.feederElementarySchool} for elementary school.`
    );
  }

  const feederRule = rules.find((r) => r.ruleType === "feeder");
  if (feederRule?.explanationPlain) {
    parts.push(feederRule.explanationPlain);
  }

  if (parts.length === 0) {
    parts.push(
      "This is an SFUSD program. Check with SFUSD for enrollment details."
    );
  }

  return parts.join(" ");
}

function isUncertain(rules: SfusdRuleRow[]): boolean {
  return rules.some((r) => r.confidence === "uncertain");
}

export function SfusdSection({ linkage, attendanceAreaName, rules }: SfusdSectionProps) {
  const explanation = buildPlainExplanation(linkage, attendanceAreaName, rules);
  const uncertain = isUncertain(rules);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-lg font-semibold text-neutral-900">
            Kindergarten Path Preview
          </h2>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
            SFUSD
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Key facts */}
          <dl className="space-y-2 text-sm text-neutral-700">
            {attendanceAreaName && (
              <div className="flex justify-between">
                <dt className="text-neutral-500">
                  <EducationTooltip
                    label="What attendance area means"
                    description={SEARCH_PROFILE_EDUCATION.attendanceArea}
                  >
                    <span className="underline decoration-dotted underline-offset-2">
                      Attendance Area
                    </span>
                  </EducationTooltip>
                </dt>
                <dd className="font-medium">{attendanceAreaName}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-neutral-500">Tiebreaker Eligible</dt>
              <dd className={linkage.tiebreakerEligible ? "font-medium text-green-700" : ""}>
                {linkage.tiebreakerEligible ? "Yes" : "No"}
              </dd>
            </div>
            {linkage.feederElementarySchool && (
              <div className="flex justify-between">
                <dt className="text-neutral-500">Feeder Elementary</dt>
                <dd className="font-medium">{linkage.feederElementarySchool}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-neutral-500">School Year</dt>
              <dd>{linkage.schoolYear}</dd>
            </div>
          </dl>

          {/* Plain-English explanation */}
          <div className="rounded-md bg-brand-50 p-3">
            <p className="text-sm text-neutral-700">{explanation}</p>
            {uncertain && (
              <p className="mt-1 text-xs text-amber-600">
                This information may change. SFUSD policies are still being finalized.
              </p>
            )}
          </div>

          {/* SFUSD enrollment link */}
          <a
            href="https://www.sfusd.edu/enroll"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm text-brand-700 hover:text-brand-800 hover:underline"
          >
            Visit SFUSD Enrollment Page
          </a>

          {/* Disclaimer */}
          <p className="rounded-md bg-neutral-50 p-3 text-xs text-neutral-500">
            {SFUSD_DISCLAIMER}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
