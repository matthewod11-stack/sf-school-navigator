import { z } from "zod";

export const submitCorrectionSchema = z.object({
  programId: z.string().uuid(),
  fieldName: z.string().min(1).max(100),
  suggestedValue: z.string().min(1).max(2000),
});

export type SubmitCorrectionInput = z.infer<typeof submitCorrectionSchema>;
