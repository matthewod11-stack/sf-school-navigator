import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/seo/queries", () => ({
  getAllProgramSlugs: vi.fn(async () => []),
  getLanguagesWithMinPrograms: vi.fn(async () => []),
}));

describe("sitemap", () => {
  it("includes guide index and detail pages", async () => {
    const { default: sitemap } = await import("./sitemap");
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://sfschoolnavigator.com/guides");
    expect(urls).toContain("https://sfschoolnavigator.com/guides/sf-school-timeline");
    expect(urls).toContain("https://sfschoolnavigator.com/guides/choosing-elementary");
  });
});
