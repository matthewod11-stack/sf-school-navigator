import slugify from "slugify";

// Neighborhoods to generate SEO pages for
const SEO_NEIGHBORHOODS = [
  "Noe Valley",
  "Mission",
  "Pacific Heights",
  "Marina",
  "Richmond",
  "Sunset",
  "SOMA",
  "Castro",
  "Haight",
  "Bernal Heights",
  "Potrero Hill",
  "Hayes Valley",
  "Cole Valley",
  "Glen Park",
  "Excelsior",
  "Bayview",
] as const;

export type SeoPageType =
  | "neighborhood"
  | "elementary-neighborhood"
  | "language"
  | "affordable"
  | "sfusd"
  | "sfusd-elementary"
  | "private-elementary"
  | "charter-elementary";

export interface SeoPageConfig {
  slug: string;
  type: SeoPageType;
  title: string;
  description: string;
  heading: string;
  filterValue: string; // neighborhood name, language, etc.
}

function toSlug(name: string): string {
  return slugify(name, { lower: true, strict: true });
}

export function getNeighborhoodPages(): SeoPageConfig[] {
  return SEO_NEIGHBORHOODS.map((name) => {
    const slug = `${toSlug(name)}-preschools`;
    return {
      slug,
      type: "neighborhood",
      title: `Best Preschools in ${name}, San Francisco | SF School Navigator`,
      description: `Find and compare preschools in ${name}, SF. See tuition, schedules, languages, and application deadlines for programs near you.`,
      heading: `Preschools in ${name}`,
      filterValue: name,
    };
  });
}

export function getElementaryNeighborhoodPages(): SeoPageConfig[] {
  return SEO_NEIGHBORHOODS.map((name) => {
    const slug = `${toSlug(name)}-elementary-schools`;
    return {
      slug,
      type: "elementary-neighborhood",
      title: `Elementary Schools in ${name}, San Francisco | SF School Navigator`,
      description: `Find SFUSD, private, and charter elementary schools in ${name}, San Francisco. Compare grades served, location, and school details.`,
      heading: `Elementary Schools in ${name}`,
      filterValue: name,
    };
  });
}

export function getLanguagePages(languages: string[]): SeoPageConfig[] {
  return languages.map((lang) => {
    const slug = `${toSlug(lang)}-immersion-sf`;
    return {
      slug,
      type: "language",
      title: `${lang} Immersion Preschools in San Francisco | SF School Navigator`,
      description: `Explore ${lang} immersion and bilingual preschool programs in San Francisco. Compare programs, costs, and schedules.`,
      heading: `${lang} Immersion Preschools in SF`,
      filterValue: lang,
    };
  });
}

export function getAffordablePage(): SeoPageConfig {
  return {
    slug: "affordable-preschools-sf",
    type: "affordable",
    title: "Affordable Preschools in San Francisco (Under $2,000/mo) | SF School Navigator",
    description:
      "Find affordable preschool programs in San Francisco under $2,000 per month. Compare costs, subsidies, and financial aid options.",
    heading: "Affordable Preschools in San Francisco",
    filterValue: "2000",
  };
}

export function getSfusdPage(): SeoPageConfig {
  return {
    slug: "sfusd-prek-programs",
    type: "sfusd",
    title: "SFUSD Pre-K Programs in San Francisco | SF School Navigator",
    description:
      "Browse free and low-cost SFUSD Pre-K and TK programs in San Francisco. Learn about attendance areas, tiebreakers, and enrollment.",
    heading: "SFUSD Pre-K Programs",
    filterValue: "sfusd",
  };
}

export function getSfusdElementaryPage(): SeoPageConfig {
  return {
    slug: "sfusd-elementary-schools",
    type: "sfusd-elementary",
    title: "SFUSD Elementary Schools in San Francisco | SF School Navigator",
    description:
      "Browse SFUSD elementary schools in San Francisco. Compare grades served, attendance-area context, and school details.",
    heading: "SFUSD Elementary Schools",
    filterValue: "sfusd-elementary",
  };
}

export function getPrivateElementaryPage(): SeoPageConfig {
  return {
    slug: "private-elementary-sf",
    type: "private-elementary",
    title: "Private Elementary Schools in San Francisco | SF School Navigator",
    description:
      "Browse private elementary schools in San Francisco. Compare grade coverage and school details from CDE data.",
    heading: "Private Elementary Schools in San Francisco",
    filterValue: "private-elementary",
  };
}

export function getCharterElementaryPage(): SeoPageConfig {
  return {
    slug: "charter-schools-sf",
    type: "charter-elementary",
    title: "Charter Schools in San Francisco | SF School Navigator",
    description:
      "Browse charter elementary schools in San Francisco. Compare grade coverage, locations, and school details.",
    heading: "Charter Elementary Schools in San Francisco",
    filterValue: "charter-elementary",
  };
}

export function getAllStaticPages(): SeoPageConfig[] {
  return [
    ...getNeighborhoodPages(),
    ...getElementaryNeighborhoodPages(),
    getAffordablePage(),
    getSfusdPage(),
    getSfusdElementaryPage(),
    getPrivateElementaryPage(),
    getCharterElementaryPage(),
  ];
}

export function findPageBySlug(
  slug: string,
  languagePages: SeoPageConfig[]
): SeoPageConfig | undefined {
  const allPages = [...getAllStaticPages(), ...languagePages];
  return allPages.find((p) => p.slug === slug);
}
