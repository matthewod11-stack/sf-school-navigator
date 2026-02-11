export interface CompareMetrics {
  matchTier: "strong" | "good" | "partial" | "hidden" | null;
  matchScore: number | null;
  distanceKm: number | null;
  attendanceAreaName: string | null;
  deadlineSummary: string | null;
}
