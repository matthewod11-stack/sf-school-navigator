import type { MatchTier } from "@/types/domain";

export interface EducationLink {
  label: string;
  href: string;
}

export interface IntakeEducationContent {
  title: string;
  body: string;
  link?: EducationLink;
}

export const INTAKE_EDUCATION = {
  child: {
    title: "Why we ask",
    body:
      "Age and target grade determine which programs can legally or practically serve your child. Potty-training and support needs are used to avoid mismatches, not to judge your family.",
    link: { label: "Read why starting early helps", href: "/guides/why-start-early" },
  },
  location: {
    title: "Why location matters",
    body:
      "Your address helps estimate commute fit and SFUSD attendance-area context. The app stores only an approximate point and attendance-area ID, not your raw address.",
    link: { label: "Learn SFUSD enrollment basics", href: "/guides/sfusd-enrollment-explained" },
  },
  schedule: {
    title: "Why schedule and budget matter",
    body:
      "Hours, start date, and monthly budget can change the realistic short list. Subsidy interest helps surface programs where financial assistance may be relevant.",
    link: { label: "See the planning timeline", href: "/guides/sf-school-timeline" },
  },
  preferences: {
    title: "Why preferences are optional",
    body:
      "Preferences help rank matches, but leaving them blank can be useful early in the search. Must-haves are stronger signals than nice-to-haves.",
    link: { label: "Read how to choose a school", href: "/guides/choosing-elementary" },
  },
  review: {
    title: "Why review before matching",
    body:
      "Small details such as grade target, budget, or address context can change scoring. Reviewing now makes the first results more useful.",
    link: { label: "Browse all guides", href: "/guides" },
  },
} satisfies Record<string, IntakeEducationContent>;

export const MATCH_TIER_EDUCATION: Record<Exclude<MatchTier, "hidden">, string> = {
  strong:
    "Strong Match means the program lines up well with the family details available, such as age or grade, budget, schedule, location, and preferences.",
  good:
    "Good Match means the program fits several important details, but may miss some preferences or have incomplete data.",
  partial:
    "Partial Match means the program may still be worth a look, but it has weaker alignment or missing information.",
};

export const SEARCH_PROFILE_EDUCATION = {
  attendanceArea:
    "Attendance areas can affect SFUSD priority, but they do not guarantee placement. Always confirm current assignment rules with SFUSD.",
  kPath:
    "K-path means this early education option may connect to later SFUSD elementary planning. Confirm current feeder or tiebreaker rules before relying on it.",
  subsidy:
    "Subsidy acceptance means a program reports support for at least one financial-assistance pathway. Eligibility, funding, and final cost still need confirmation.",
  profileCompleteness:
    "Profile completeness reflects how much structured information SF School Navigator has verified for this listing. Incomplete profiles may still be good options.",
  gradeLevels:
    "Grade labels show the grades this program appears to serve in the current dataset. Confirm grade availability with the program before applying.",
} as const;
