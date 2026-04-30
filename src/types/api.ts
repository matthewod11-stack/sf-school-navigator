// API request/response types for SF School Navigator

import type {
  ProgramWithDetails,
  MatchTier,
  GradeLevel,
  ProgramType,
  ScheduleType,
  SavedProgramStatus,
  CostEstimateBand,
} from "./domain";

// ============================================================
// Search / Results
// ============================================================

export interface SearchFilters {
  budgetMax: number | null;
  programTypes: ProgramType[];
  languages: string[];
  scheduleTypes: ScheduleType[];
  gradeLevels: GradeLevel[];
  maxDistanceKm: number | null;
  scoredOnly: boolean;
  query: string | null; // text search on program name
  verifiedWithinMonths: number | null; // hide programs not verified within N months
}

export type SortOption = "match" | "distance" | "cost-low" | "cost-high";

export interface SearchRequest {
  filters: SearchFilters;
  sort: SortOption;
  page: number;
  pageSize: number;
  familyId?: string;
}

export interface SearchResult {
  program: ProgramWithDetails;
  matchTier: MatchTier | null;
  matchScore: number | null; // internal, for sorting only
  distanceKm: number | null;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
  appliedFilters: SearchFilters;
  mostLimitingFilter: string | null; // shown when 0 results
}

// ============================================================
// Intake
// ============================================================

export interface IntakeStep1 {
  childLabel: string | null;
  childDob: string | null;
  childExpectedDueDate: string | null;
  gradeTarget: GradeLevel;
  pottyTrained: boolean | null;
  hasSpecialNeeds: boolean | null;
  hasMultiples: boolean;
  numChildren: number;
}

export interface IntakeStep2 {
  homeAddress: string; // raw, never stored — geocoded then discarded
}

export interface IntakeStep3 {
  budgetMonthlyMax: number | null;
  subsidyInterested: boolean;
  costEstimateBand: CostEstimateBand;
  scheduleDaysNeeded: number | null;
  scheduleHoursNeeded: number | null;
  startDate: string | null;
}

export interface IntakeStep4 {
  philosophy: string[];
  languages: string[];
  mustHaves: string[];
  niceToHaves: string[];
}

export interface IntakeData {
  step1: IntakeStep1;
  step2: IntakeStep2;
  step3: IntakeStep3;
  step4: IntakeStep4;
}

// ============================================================
// Geocoding
// ============================================================

export interface GeocodeResult {
  fuzzedCoordinates: { lng: number; lat: number };
  attendanceAreaId: string | null;
  attendanceAreaName: string | null;
}

// ============================================================
// Saved Programs
// ============================================================

export interface UpdateSavedProgramRequest {
  status?: SavedProgramStatus;
  notes?: string;
  reminderLeadDays?: number;
}

// ============================================================
// User Corrections
// ============================================================

export interface SubmitCorrectionRequest {
  programId: string;
  fieldName: string;
  suggestedValue: string;
}
