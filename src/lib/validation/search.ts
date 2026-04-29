import { z } from "zod";

const programTypes = [
  "center", "family-home", "sfusd-prek", "sfusd-tk", "sfusd-elementary",
  "private-elementary", "charter-elementary", "head-start", "montessori",
  "waldorf", "religious", "co-op", "other",
] as const;

const gradeLevels = ["prek", "tk", "k", "1", "2", "3", "4", "5"] as const;
const scheduleTypes = ["full-day", "half-day-am", "half-day-pm", "extended-day"] as const;
const sortOptions = ["match", "distance", "cost-low", "cost-high"] as const;

export const searchFiltersSchema = z.object({
  budgetMax: z.number().min(0).nullable(),
  programTypes: z.array(z.enum(programTypes)),
  gradeLevels: z.array(z.enum(gradeLevels)),
  languages: z.array(z.string()),
  scheduleTypes: z.array(z.enum(scheduleTypes)),
  maxDistanceKm: z.number().min(0).nullable(),
  scoredOnly: z.boolean(),
  query: z.string().nullable(),
  verifiedWithinMonths: z.number().int().min(1).max(24).nullable().optional(),
});

export const searchRequestSchema = z.object({
  filters: searchFiltersSchema,
  sort: z.enum(sortOptions),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  familyId: z.string().uuid().optional(),
});

export type SearchFiltersInput = z.infer<typeof searchFiltersSchema>;
export type SearchRequestInput = z.infer<typeof searchRequestSchema>;
