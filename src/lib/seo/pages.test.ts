import { describe, expect, it } from "vitest";
import {
  findPageBySlug,
  getAllStaticPages,
  getElementaryNeighborhoodPages,
} from "./pages";

describe("SEO page registry", () => {
  it("includes the required elementary school route configs", () => {
    const slugs = getAllStaticPages().map((page) => page.slug);

    expect(slugs).toContain("sfusd-elementary-schools");
    expect(slugs).toContain("private-elementary-sf");
    expect(slugs).toContain("charter-schools-sf");
    expect(slugs).toContain("noe-valley-elementary-schools");
  });

  it("marks elementary neighborhood pages separately from preschool neighborhood pages", () => {
    const pages = getElementaryNeighborhoodPages();

    expect(pages.length).toBeGreaterThan(0);
    expect(pages.every((page) => page.type === "elementary-neighborhood")).toBe(true);
    expect(pages.every((page) => page.slug.endsWith("-elementary-schools"))).toBe(true);
  });

  it("resolves elementary static pages by slug", () => {
    const page = findPageBySlug("private-elementary-sf", []);

    expect(page).toMatchObject({
      type: "private-elementary",
      filterValue: "private-elementary",
    });
  });
});
