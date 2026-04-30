import { z } from "zod";

export const intakeStep1Schema = z.object({
  childLabel: z.string().trim().min(1).max(40).nullable(),
  childDob: z.string().nullable(),
  childExpectedDueDate: z.string().nullable(),
  gradeTarget: z.enum(["prek", "tk", "k", "1", "2", "3", "4", "5"]),
  pottyTrained: z.boolean().nullable(),
  hasSpecialNeeds: z.boolean().nullable(),
  hasMultiples: z.boolean(),
  numChildren: z.number().int().min(1).max(10),
}).refine(
  (data) => data.childDob !== null || data.childExpectedDueDate !== null,
  { message: "Either child's date of birth or expected due date is required" }
);

export const intakeStep2Schema = z.object({
  homeAddress: z.string().min(5, "Please enter a valid address"),
});

export const intakeStep3Schema = z.object({
  budgetMonthlyMax: z.number().min(0).nullable(),
  subsidyInterested: z.boolean(),
  costEstimateBand: z.enum([
    "unknown",
    "sticker-only",
    "elfa-free-0-110-ami",
    "elfa-full-credit-111-150-ami",
    "elfa-half-credit-151-200-ami",
    "not-eligible-over-200-ami",
  ]),
  scheduleDaysNeeded: z.number().int().min(1).max(7).nullable(),
  scheduleHoursNeeded: z.number().min(1).max(24).nullable(),
  startDate: z.string().nullable(),
});

export const intakeStep4Schema = z.object({
  philosophy: z.array(z.string()),
  languages: z.array(z.string()),
  mustHaves: z.array(z.string()),
  niceToHaves: z.array(z.string()),
});

export type IntakeStep1Input = z.infer<typeof intakeStep1Schema>;
export type IntakeStep2Input = z.infer<typeof intakeStep2Schema>;
export type IntakeStep3Input = z.infer<typeof intakeStep3Schema>;
export type IntakeStep4Input = z.infer<typeof intakeStep4Schema>;
