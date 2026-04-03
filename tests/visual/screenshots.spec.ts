import { test, expect } from "@playwright/test";

// Primary routes that can be tested without auth or dynamic data.
// Routes not covered: /dashboard (requires auth), /programs/[slug] (requires DB data).
// To add mobile-safari, add a second project in playwright.config.ts.
const ROUTES = [
  { name: "homepage", path: "/" },
  { name: "intake", path: "/intake" },
  { name: "search", path: "/search" },
  { name: "compare", path: "/compare" },
  { name: "schools-noe-valley", path: "/schools/noe-valley-preschools" },
  { name: "schools-mission", path: "/schools/mission-preschools" },
] as const;

for (const route of ROUTES) {
  test(`visual: ${route.name}`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: "networkidle" });
    await expect(page).toHaveScreenshot(`${route.name}.png`);
  });
}
