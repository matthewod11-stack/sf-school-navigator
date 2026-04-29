export interface GuideLink {
  label: string;
  href: string;
}

export interface GuideSection {
  heading: string;
  body: string[];
  bullets?: string[];
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  category: "timeline" | "preschool" | "sfusd" | "elementary";
  readTime: string;
  updatedLabel: string;
  highlights: string[];
  sections: GuideSection[];
  relatedLinks: GuideLink[];
  sources: GuideLink[];
}

export const GUIDES: Guide[] = [
  {
    slug: "sf-school-timeline",
    title: "SF school search timeline",
    description:
      "A practical calendar for San Francisco preschool, TK, kindergarten, and elementary planning.",
    category: "timeline",
    readTime: "5 min read",
    updatedLabel: "Reviewed April 2026",
    highlights: [
      "Start research earlier than the application window so tours, documents, and backup options do not pile up at once.",
      "SFUSD dates change by school year; always confirm the current cycle before submitting an application.",
      "Private preschool and elementary schools often use their own timelines, so track each program separately.",
    ],
    sections: [
      {
        heading: "12-18 months before you need care or school",
        body: [
          "Build a broad first list. For preschool and child care, include centers, family child care homes, SFUSD early education, and programs that participate in Early Learning For All. For elementary school, include your attendance-area school, citywide programs, and any private or charter options that fit your commute.",
          "Use this stage to clarify constraints: hours, location, language, age eligibility, grade served, cost, and whether the program can meet your child's support needs.",
        ],
      },
      {
        heading: "Fall before the school year starts",
        body: [
          "SFUSD usually opens the next school-year enrollment cycle in the fall, with tours, enrollment events, and application materials posted by the district. Private programs may also begin tours and applications around this time, but each school sets its own process.",
          "Gather proof of birth, proof of address, immunization records, custody paperwork if relevant, and any program-specific forms. Having documents ready makes the final application week much less stressful.",
        ],
      },
      {
        heading: "Main application window",
        body: [
          "For the 2026-27 SFUSD cycle, the district listed January 30, 2026 as the Main Round deadline for TK-12 applications. That date is cycle-specific, so check SFUSD's current key dates page before relying on it for a future year.",
          "If you are applying to private schools or child care programs, ask each program when applications, tours, family interviews, deposits, and financial aid forms are due. These dates rarely line up perfectly across programs.",
        ],
      },
      {
        heading: "Spring and summer follow-through",
        body: [
          "After assignments or offers arrive, compare the full picture: commute, schedule, before/after care, cost after aid, program philosophy, and sibling logistics. If you are waitlisted, ask what action is required to remain active.",
          "Keep a small backup list until enrollment is confirmed. A good backup is not just a less-preferred school; it is a school that can realistically work for your family's hours, location, and budget.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Start the matching intake", href: "/intake" },
      { label: "Browse current programs", href: "/search" },
      { label: "Read how SFUSD enrollment works", href: "/guides/sfusd-enrollment-explained" },
    ],
    sources: [
      { label: "SFUSD enrollment key dates", href: "https://www.sfusd.edu/schools/enroll/apply/key-dates" },
      { label: "SFUSD apply page", href: "https://www.sfusd.edu/schools/enroll/apply" },
      { label: "Early Learning For All", href: "https://sfdec.org/early-learning-for-all/" },
    ],
  },
  {
    slug: "why-start-early",
    title: "Why start early",
    description:
      "Why San Francisco families benefit from researching preschool, child care, and elementary options before deadlines arrive.",
    category: "preschool",
    readTime: "4 min read",
    updatedLabel: "Reviewed April 2026",
    highlights: [
      "Early research gives you time to compare actual fit, not just availability.",
      "Subsidy, schedule, and commute constraints often matter as much as program philosophy.",
      "Starting early reduces the chance that one missed tour, form, or waitlist deadline controls the whole decision.",
    ],
    sections: [
      {
        heading: "The best fit is usually a practical fit",
        body: [
          "A school can sound ideal and still be hard to use every weekday. San Francisco families often need to balance commute time, drop-off windows, extended care, siblings, language, tuition, and public transit or parking.",
          "Starting early lets you remove programs that cannot work logistically before you spend energy on tours and applications.",
        ],
      },
      {
        heading: "Financial aid and subsidy questions take time",
        body: [
          "Some families may qualify for free or discounted early learning through San Francisco's Early Learning For All network or other subsidy pathways. Eligibility and availability depend on family circumstances, program participation, and current funding rules.",
          "Ask programs how they handle subsidies, deposits, sibling discounts, and tuition assistance before you assume the published tuition is the final cost.",
        ],
      },
      {
        heading: "Tours reveal details that websites miss",
        body: [
          "Websites rarely tell the full story about classroom rhythm, teacher communication, nap transitions, outdoor time, mixed-age grouping, or how a program supports children who need extra help separating, toileting, or regulating emotions.",
          "A short list created early gives you time to tour more than one type of setting: center-based care, family child care, SFUSD early education, language immersion, play-based programs, and elementary options.",
        ],
      },
      {
        heading: "A calmer search helps your child too",
        body: [
          "When adults are rushed, every choice can feel permanent. A longer runway makes it easier to explain transitions, visit neighborhoods, practice new routines, and choose a backup that still feels acceptable.",
        ],
      },
    ],
    relatedLinks: [
      { label: "See the school search timeline", href: "/guides/sf-school-timeline" },
      { label: "Compare programs", href: "/search" },
      { label: "Start with your family needs", href: "/intake" },
    ],
    sources: [
      { label: "Early Learning For All", href: "https://sfdec.org/early-learning-for-all/" },
      {
        label: "Children's Council child care financial assistance",
        href: "https://www.childrenscouncil.org/families/help-paying-for-child-care/",
      },
    ],
  },
  {
    slug: "sfusd-enrollment-explained",
    title: "SFUSD enrollment explained",
    description:
      "A plain-English guide to SFUSD applications, attendance areas, waitlists, and what families should double-check.",
    category: "sfusd",
    readTime: "6 min read",
    updatedLabel: "Reviewed April 2026",
    highlights: [
      "Families rank schools; assignment depends on available seats and SFUSD's current tiebreaker rules.",
      "An attendance-area school can improve priority, but it is not a guarantee.",
      "Waitlist and open-enrollment steps are separate from the Main Round and should be tracked carefully.",
    ],
    sections: [
      {
        heading: "Main Round applications",
        body: [
          "SFUSD runs an annual application cycle for the next school year. Families submit ranked choices, and the district assigns seats based on preferences, available space, and assignment rules for that year.",
          "For the 2026-27 cycle, SFUSD listed a single Main Round deadline of January 30, 2026 for TK-12 applications. Treat that as historical context for this cycle and confirm the current deadline directly with SFUSD before applying.",
        ],
      },
      {
        heading: "Attendance areas and citywide schools",
        body: [
          "Most elementary schools have attendance areas. Living in an attendance area can create a tiebreaker for that school, but SFUSD states that families are not required to choose their attendance-area school and are not guaranteed placement there.",
          "Some schools or programs are citywide and do not have attendance areas. Those options can be worth considering when your commute, language preference, or program needs point beyond your neighborhood.",
        ],
      },
      {
        heading: "Assignments, waitlists, and open enrollment",
        body: [
          "After the Main Round, families receive assignments and response instructions. Families who do not receive higher-ranked choices may have waitlist options depending on current SFUSD rules.",
          "Open Enrollment is a later process for families who need an assignment or want to change one. SFUSD describes it as first-come, first-served for schools with available seats and no waitlist demand, so it should not be treated as the same thing as the Main Round.",
        ],
      },
      {
        heading: "What to double-check",
        body: [
          "Before submitting, confirm grade eligibility, address, documents, sibling information, language program requirements, and whether your choices include both preferred schools and workable backups.",
          "After assignment, read the response instructions closely. Some students are automatically enrolled, while others may need to accept, decline, or follow up by a stated deadline.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Browse SFUSD elementary schools", href: "/schools/sfusd-elementary-schools" },
      { label: "Find your match", href: "/intake" },
      { label: "Read the timeline guide", href: "/guides/sf-school-timeline" },
    ],
    sources: [
      { label: "SFUSD enrollment", href: "https://www.sfusd.edu/schools/enroll" },
      { label: "SFUSD enrollment key dates", href: "https://www.sfusd.edu/schools/enroll/apply/key-dates" },
      { label: "SFUSD attendance areas", href: "https://www.sfusd.edu/student-assignment-policy/tiebreakers/attendance-area" },
      { label: "SFUSD open enrollment", href: "https://www.sfusd.edu/schools/enroll/apply/open-enrollment" },
    ],
  },
  {
    slug: "choosing-elementary",
    title: "How to choose an elementary school",
    description:
      "A family-centered framework for comparing SFUSD, private, and charter elementary options in San Francisco.",
    category: "elementary",
    readTime: "6 min read",
    updatedLabel: "Reviewed April 2026",
    highlights: [
      "Start with daily fit: commute, hours, aftercare, siblings, and support needs.",
      "Compare instructional model, community feel, and grade continuity together.",
      "Use rankings and test data as context, not as a substitute for visiting and asking specific questions.",
    ],
    sections: [
      {
        heading: "Start with your non-negotiables",
        body: [
          "Before comparing philosophies, name the constraints that would make a school hard to attend: commute, start time, aftercare, cost, language access, special education services, medical needs, or sibling coordination.",
          "A shorter list of schools that can actually work will produce better decisions than a long list built from reputation alone.",
        ],
      },
      {
        heading: "Compare the learning environment",
        body: [
          "Ask how the school teaches reading and math, how teachers communicate progress, what enrichment looks like, and how the school handles conflict, inclusion, and social-emotional development.",
          "For language immersion or specialized programs, ask what support exists for students entering with different levels of exposure and how families can help at home.",
        ],
      },
      {
        heading: "Understand continuity",
        body: [
          "Some families prioritize a K-5 or K-8 path with fewer transitions. Others prefer a strong elementary experience even if middle school will require a later decision. Both can be reasonable; the important part is knowing the transition points before you enroll.",
          "If you are considering TK, preschool, or an early education site, confirm how that placement affects kindergarten enrollment, feeder patterns, or tiebreakers under the current rules.",
        ],
      },
      {
        heading: "Use visits to test fit",
        body: [
          "On tours, listen for specifics. How does the school support a child who is ahead in one area and behind in another? What happens when aftercare is full? How are new families welcomed? How do teachers communicate concerns?",
          "After each visit, write down what felt energizing, what felt unclear, and what would make the school hard for your household. Those notes are often more useful than a generic star rating weeks later.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Browse elementary schools", href: "/schools/sfusd-elementary-schools" },
      { label: "Compare programs", href: "/compare" },
      { label: "Learn SFUSD enrollment basics", href: "/guides/sfusd-enrollment-explained" },
    ],
    sources: [
      { label: "SFUSD apply page", href: "https://www.sfusd.edu/schools/enroll/apply" },
      { label: "SFUSD attendance areas", href: "https://www.sfusd.edu/student-assignment-policy/tiebreakers/attendance-area" },
    ],
  },
];

export function getAllGuides(): Guide[] {
  return GUIDES;
}

export function getGuideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}
