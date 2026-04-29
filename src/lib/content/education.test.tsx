import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EducationCallout } from "@/components/education/education-callout";
import { EducationTooltip } from "@/components/education/education-tooltip";
import {
  INTAKE_EDUCATION,
  MATCH_TIER_EDUCATION,
  SEARCH_PROFILE_EDUCATION,
} from "./education";

describe("education content", () => {
  it("provides contextual intake copy for each wizard step", () => {
    expect(Object.keys(INTAKE_EDUCATION)).toEqual([
      "child",
      "location",
      "schedule",
      "preferences",
      "review",
    ]);
    expect(INTAKE_EDUCATION.location.link?.href).toBe(
      "/guides/sfusd-enrollment-explained"
    );
  });

  it("centralizes search and profile tooltip copy", () => {
    expect(MATCH_TIER_EDUCATION.strong).toContain("Strong Match");
    expect(SEARCH_PROFILE_EDUCATION.attendanceArea).toContain("SFUSD");
    expect(SEARCH_PROFILE_EDUCATION.subsidy).toContain("Eligibility");
  });

  it("renders intake callouts collapsed with aria-expanded state", () => {
    const html = renderToStaticMarkup(
      <EducationCallout content={INTAKE_EDUCATION.child} />
    );

    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("Why we ask");
    expect(html).not.toContain(INTAKE_EDUCATION.child.body);
  });

  it("renders keyboard-accessible tooltip markup", () => {
    const html = renderToStaticMarkup(
      <EducationTooltip
        label="What attendance area means"
        description={SEARCH_PROFILE_EDUCATION.attendanceArea}
      >
        <span>Attendance Area</span>
      </EducationTooltip>
    );

    expect(html).toContain("aria-describedby=");
    expect(html).toContain('role="tooltip"');
    expect(html).toContain(SEARCH_PROFILE_EDUCATION.attendanceArea);
  });
});
