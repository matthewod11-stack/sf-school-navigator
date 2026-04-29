import { describe, expect, it } from "vitest";
import { getAllGuides, getGuideBySlug } from "./guides";

describe("guide registry", () => {
  it("includes the initial Phase 4 guide pages", () => {
    const slugs = getAllGuides().map((guide) => guide.slug);

    expect(slugs).toEqual([
      "sf-school-timeline",
      "why-start-early",
      "sfusd-enrollment-explained",
      "choosing-elementary",
    ]);
  });

  it("resolves guides by slug with metadata and official sources", () => {
    const guide = getGuideBySlug("sfusd-enrollment-explained");

    expect(guide).toMatchObject({
      title: "SFUSD enrollment explained",
      category: "sfusd",
    });
    expect(guide?.sources.some((source) => source.href.includes("sfusd.edu"))).toBe(true);
    expect(guide?.relatedLinks).toContainEqual({
      label: "Browse SFUSD elementary schools",
      href: "/schools/sfusd-elementary-schools",
    });
  });
});
