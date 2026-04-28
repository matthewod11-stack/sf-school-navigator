import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QualityBanner } from "@/components/programs/quality-banner";
import {
  getFreshnessState,
  getProgramQualityTier,
  getProgramTrustSummary,
} from "./program-quality";

describe("program quality trust metadata", () => {
  it("classifies quality tiers at the roadmap boundaries", () => {
    expect(getProgramQualityTier(0)).toBe("skeletal");
    expect(getProgramQualityTier(29)).toBe("skeletal");
    expect(getProgramQualityTier(30)).toBe("basic");
    expect(getProgramQualityTier(49)).toBe("basic");
    expect(getProgramQualityTier(50)).toBe("adequate");
    expect(getProgramQualityTier(79)).toBe("adequate");
    expect(getProgramQualityTier(80)).toBe("complete");
  });

  it("derives freshness state from last verified date", () => {
    const now = new Date("2026-04-28T00:00:00Z");

    expect(getFreshnessState(null, now)).toBe("unknown");
    expect(getFreshnessState("2026-04-01T00:00:00Z", now)).toBe("fresh");
    expect(getFreshnessState("2025-01-01T00:00:00Z", now)).toBe("stale");
  });

  it("flags skeletal and basic profiles for a limited information banner", () => {
    expect(getProgramTrustSummary({ score: 20 }).showLimitedInfoBanner).toBe(true);
    expect(getProgramTrustSummary({ score: 45 }).showLimitedInfoBanner).toBe(true);
    expect(getProgramTrustSummary({ score: 70 }).showLimitedInfoBanner).toBe(false);
  });

  it("renders limited information banner only when needed", () => {
    const limited = renderToStaticMarkup(<QualityBanner score={40} />);
    const complete = renderToStaticMarkup(<QualityBanner score={95} />);

    expect(limited).toContain("Limited information");
    expect(complete).toBe("");
  });
});

