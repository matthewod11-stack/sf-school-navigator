import { describe, expect, it } from "vitest";
import { normalizeExternalUrl } from "./external";

describe("normalizeExternalUrl", () => {
  it("keeps valid HTTP(S) URLs", () => {
    expect(normalizeExternalUrl("https://www.sfusd.edu/school/bryant")).toBe(
      "https://www.sfusd.edu/school/bryant"
    );
    expect(normalizeExternalUrl("sf.gov/early-learning-for-all")).toBe(
      "https://sf.gov/early-learning-for-all"
    );
  });

  it("rejects source placeholders and fake example domains", () => {
    expect(normalizeExternalUrl("No Data")).toBeNull();
    expect(normalizeExternalUrl("https://No Data")).toBeNull();
    expect(normalizeExternalUrl("https://sunshinevalleypreschool.example.com")).toBeNull();
    expect(normalizeExternalUrl("https://example.org/apply")).toBeNull();
  });

  it("rejects invalid or non-web URLs", () => {
    expect(normalizeExternalUrl("mailto:admissions@example.com")).toBeNull();
    expect(normalizeExternalUrl("mailto:admissions@school.org")).toBeNull();
    expect(normalizeExternalUrl("http://")).toBeNull();
    expect(normalizeExternalUrl("")).toBeNull();
  });
});
