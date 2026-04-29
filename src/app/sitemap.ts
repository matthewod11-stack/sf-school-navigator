import type { MetadataRoute } from "next";
import { getAllGuides } from "@/lib/guides/guides";
import { getAllStaticPages, getLanguagePages } from "@/lib/seo/pages";
import {
  getAllProgramSlugs,
  getLanguagesWithMinPrograms,
} from "@/lib/seo/queries";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sfschoolnavigator.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  entries.push(
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/intake`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/guides`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  );

  // Guide pages
  for (const guide of getAllGuides()) {
    entries.push({
      url: `${BASE_URL}/guides/${guide.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  // Program profile pages
  try {
    const slugs = await getAllProgramSlugs();
    for (const slug of slugs) {
      entries.push({
        url: `${BASE_URL}/programs/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // DB may be unavailable at build time
  }

  // SEO pages (neighborhoods, affordable, sfusd)
  const staticSeoPages = getAllStaticPages();
  for (const page of staticSeoPages) {
    entries.push({
      url: `${BASE_URL}/schools/${page.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // Language SEO pages
  try {
    const languages = await getLanguagesWithMinPrograms(3);
    const languagePages = getLanguagePages(languages);
    for (const page of languagePages) {
      entries.push({
        url: `${BASE_URL}/schools/${page.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // DB may be unavailable at build time
  }

  return entries;
}
