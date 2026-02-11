// SF-specific configuration for School Navigator

export const SF_NEIGHBORHOODS = [
  "Bayview",
  "Bernal Heights",
  "Castro",
  "Chinatown",
  "Cole Valley",
  "Cow Hollow",
  "Diamond Heights",
  "Dogpatch",
  "Excelsior",
  "Financial District",
  "Glen Park",
  "Haight-Ashbury",
  "Hayes Valley",
  "Hunters Point",
  "Ingleside",
  "Inner Richmond",
  "Inner Sunset",
  "Jackson Square",
  "Japantown",
  "Lakeshore",
  "Laurel Heights",
  "Lower Haight",
  "Lower Pacific Heights",
  "Marina",
  "McLaren Park",
  "Mission",
  "Mission Bay",
  "Nob Hill",
  "Noe Valley",
  "North Beach",
  "Oceanview",
  "Outer Mission",
  "Outer Richmond",
  "Outer Sunset",
  "Pacific Heights",
  "Parkside",
  "Portola",
  "Potrero Hill",
  "Presidio",
  "Russian Hill",
  "SOMA",
  "Sea Cliff",
  "Stonestown",
  "Sunset",
  "Telegraph Hill",
  "Tenderloin",
  "Twin Peaks",
  "Visitacion Valley",
  "West Portal",
  "Western Addition",
] as const;

export type SfNeighborhood = (typeof SF_NEIGHBORHOODS)[number];

// Subsidy thresholds for flagging Baby C eligibility
// Based on 2025-26 SF income guidelines (approximate)
export const SUBSIDY_INCOME_THRESHOLDS = {
  // California state subsidy (Stage 1/2/3) income ceiling by family size
  // Source: California Dept. of Social Services
  state: {
    1: 4392, // monthly
    2: 5933,
    3: 7475,
    4: 9008,
    5: 10417,
    6: 11825,
  } as Record<number, number>,
  // SF Baby C (city-funded subsidy) — higher thresholds
  babyC: {
    1: 8917,
    2: 10208,
    3: 11483,
    4: 12758,
    5: 13792,
    6: 14808,
  } as Record<number, number>,
};

// Common program philosophies for intake multi-select
export const PROGRAM_PHILOSOPHIES = [
  "Play-based",
  "Montessori",
  "Waldorf/Steiner",
  "Reggio Emilia",
  "Academic/Structured",
  "Religious/Faith-based",
  "Outdoor/Nature",
  "Language Immersion",
  "Co-op (parent participation)",
] as const;

// Common languages offered in SF programs
export const PROGRAM_LANGUAGES = [
  "English",
  "Spanish",
  "Mandarin",
  "Cantonese",
  "Japanese",
  "Korean",
  "Tagalog",
  "French",
  "Russian",
] as const;

// SFUSD disclaimer (used on all K-path features)
export const SFUSD_DISCLAIMER =
  "Based on current SFUSD policies as of the listed school year. Policies are subject to change. Verify all information with SFUSD directly. This tool provides informational guidance, not official enrollment advice.";

// Map defaults
export const SF_MAP_CENTER = { lng: -122.4194, lat: 37.7749 } as const;
export const SF_MAP_ZOOM = 12;
export const SF_MAP_BOUNDS = {
  sw: { lng: -122.5155, lat: 37.7080 },
  ne: { lng: -122.3570, lat: 37.8120 },
} as const;
