import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CostEstimateSummary } from "./cost-estimate-summary";
import type { ProgramCostEstimate } from "@/lib/cost/estimate";

const estimate: ProgramCostEstimate = {
  band: "elfa-full-credit-111-150-ami",
  stickerMonthlyLow: 1800,
  stickerMonthlyHigh: 2400,
  estimatedMonthlyLow: 0,
  estimatedMonthlyHigh: 285,
  label: "Estimated $0-$285/mo",
  confidence: "likely",
  caveats: ["Final family cost can vary."],
  officialLinks: [
    {
      label: "DEC Early Learning For All",
      href: "https://www.sf.gov/early-learning-for-all",
    },
  ],
};

describe("CostEstimateSummary", () => {
  it("renders estimate label, sticker price, caveat, and official link", () => {
    const html = renderToStaticMarkup(<CostEstimateSummary estimate={estimate} />);

    expect(html).toContain("Estimated $0-$285/mo");
    expect(html).toContain("$1,800-$2,400/mo");
    expect(html).toContain("Final family cost can vary.");
    expect(html).toContain("DEC Early Learning For All");
  });

  it("keeps compact rendering concise for cards", () => {
    const html = renderToStaticMarkup(
      <CostEstimateSummary estimate={estimate} compact />
    );

    expect(html).toContain("Estimated $0-$285/mo");
    expect(html).not.toContain("Sticker price");
  });
});
