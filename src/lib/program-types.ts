import type { GradeLevel, ProgramType } from "@/types/domain";

export const GRADE_LEVELS: GradeLevel[] = ["prek", "tk", "k", "1", "2", "3", "4", "5"];

export const GRADE_LEVEL_LABELS: Record<GradeLevel, string> = {
  prek: "Pre-K",
  tk: "TK",
  k: "Kindergarten",
  "1": "1st Grade",
  "2": "2nd Grade",
  "3": "3rd Grade",
  "4": "4th Grade",
  "5": "5th Grade",
};

export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  center: "Center",
  "family-home": "Family Home",
  "sfusd-prek": "SFUSD Pre-K",
  "sfusd-tk": "SFUSD TK",
  "sfusd-elementary": "SFUSD Elementary",
  "private-elementary": "Private Elementary",
  "charter-elementary": "Charter Elementary",
  "head-start": "Head Start",
  montessori: "Montessori",
  waldorf: "Waldorf",
  religious: "Religious",
  "co-op": "Co-op",
  other: "Other",
};

export const FILTER_PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  ...PROGRAM_TYPE_LABELS,
  center: "Center-based",
};

export function isElementaryProgramType(type: ProgramType): boolean {
  return type === "sfusd-elementary" || type === "private-elementary" || type === "charter-elementary";
}

export function isPreschoolProgramType(type: ProgramType): boolean {
  return !isElementaryProgramType(type);
}

export function formatGradeLevels(levels: GradeLevel[]): string {
  if (levels.length === 0) return "";
  return levels.map((level) => GRADE_LEVEL_LABELS[level]).join(", ");
}
