// SF School Navigator — Domain Types
// Shared contract between pipeline (Agent A) and frontend (Agent B)
// Must match the database schema in supabase/migrations/

export type ProgramType =
  | "center"
  | "family-home"
  | "sfusd-prek"
  | "sfusd-tk"
  | "head-start"
  | "montessori"
  | "waldorf"
  | "religious"
  | "co-op"
  | "other";

export type ScheduleType = "full-day" | "half-day-am" | "half-day-pm" | "extended-day";
export type SchedulePeriod = "school-year" | "full-year";
export type ImmersionType = "full" | "dual" | "exposure";
export type DeadlineType = "application-open" | "application-close" | "notification" | "waitlist";
export type SfusdRuleType = "attendance-area" | "tiebreaker" | "feeder" | "lottery";
export type ConfidenceLevel = "confirmed" | "likely" | "uncertain";
export type DataSource = "ccl" | "sfusd" | "website-scrape" | "manual" | "user-correction";
export type DataQualityTier = "skeletal" | "basic" | "adequate" | "complete";
export type URLValidationStatus = "valid" | "redirect" | "broken" | "timeout" | "dns_failure";
export type AddressValidationStatus =
  | "valid"
  | "mismatch"
  | "low_relevance"
  | "outside_sf"
  | "missing_address"
  | "missing_coordinates"
  | "geocode_failed";
export type CorrectionStatus = "pending" | "approved" | "rejected";
export type SavedProgramStatus =
  | "researching"
  | "toured"
  | "applied"
  | "waitlisted"
  | "accepted"
  | "enrolled"
  | "rejected";
export type TransportMode = "car" | "transit" | "walk" | "bike";

// ============================================================
// Core domain models
// ============================================================

export interface Program {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  coordinates: { lng: number; lat: number } | null;
  phone: string | null;
  website: string | null;
  primaryType: ProgramType;
  licenseNumber: string | null;
  licenseStatus: string | null;
  logoUrl: string | null;
  featuredImageUrl: string | null;
  ageMinMonths: number | null;
  ageMaxMonths: number | null;
  pottyTrainingRequired: boolean | null;
  dataCompletenessScore: number;
  dataQualityTier?: DataQualityTier | null;
  dataQualityTierCheckedAt?: string | null;
  urlValidationStatus?: URLValidationStatus | null;
  urlValidationCheckedAt?: string | null;
  urlFinalUrl?: string | null;
  addressValidationStatus?: AddressValidationStatus | null;
  addressValidationCheckedAt?: string | null;
  addressMismatchMeters?: number | null;
  addressRelevanceScore?: number | null;
  lastVerifiedAt: string | null;
  dataSource: DataSource;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramTag {
  id: string;
  programId: string;
  tag: string;
}

export interface ProgramSchedule {
  id: string;
  programId: string;
  scheduleType: ScheduleType;
  daysPerWeek: number | null;
  openTime: string | null;
  closeTime: string | null;
  extendedCareAvailable: boolean;
  summerProgram: boolean;
  operates: SchedulePeriod;
  monthlyCostLow: number | null;
  monthlyCostHigh: number | null;
  registrationFee: number | null;
  deposit: number | null;
}

export interface ProgramLanguage {
  id: string;
  programId: string;
  language: string;
  immersionType: ImmersionType;
}

export interface ProgramCost {
  id: string;
  programId: string;
  schoolYear: string;
  tuitionMonthlyLow: number | null;
  tuitionMonthlyHigh: number | null;
  registrationFee: number | null;
  deposit: number | null;
  acceptsSubsidies: boolean;
  financialAidAvailable: boolean;
}

export interface ProgramDeadline {
  id: string;
  programId: string;
  schoolYear: string;
  deadlineType: DeadlineType;
  date: string | null;
  description: string | null;
  genericDeadlineEstimate: string | null;
  sourceUrl: string | null;
  verifiedAt: string | null;
}

export interface SfusdRule {
  id: string;
  schoolYear: string;
  ruleType: SfusdRuleType;
  ruleText: string;
  explanationPlain: string | null;
  sourceUrl: string | null;
  confidence: ConfidenceLevel;
  effectiveDate: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface AttendanceArea {
  id: string;
  name: string;
  schoolYear: string;
  linkedElementarySchoolIds: string[];
  createdAt: string;
}

export interface ProgramSfusdLinkage {
  id: string;
  programId: string;
  attendanceAreaId: string;
  schoolYear: string;
  feederElementarySchool: string | null;
  tiebreakerEligible: boolean;
  ruleVersionId: string | null;
}

export interface FieldProvenance {
  id: string;
  programId: string;
  fieldName: string;
  valueText: string | null;
  source: DataSource;
  rawSnippet: string | null;
  extractedAt: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
}

export interface UserCorrection {
  id: string;
  programId: string;
  fieldName: string;
  suggestedValue: string;
  submittedBy: string;
  submittedAt: string;
  status: CorrectionStatus;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface FamilyPreferences {
  philosophy: string[];
  languages: string[];
  mustHaves: string[];
  niceToHaves: string[];
}

export interface Family {
  id: string;
  userId: string;
  childAgeMonths: number | null;
  childExpectedDueDate: string | null;
  hasSpecialNeeds: boolean | null;
  hasMultiples: boolean;
  numChildren: number;
  pottyTrained: boolean | null;
  homeAttendanceAreaId: string | null;
  homeCoordinatesFuzzed: { lng: number; lat: number } | null;
  budgetMonthlyMax: number | null;
  subsidyInterested: boolean;
  scheduleDaysNeeded: number | null;
  scheduleHoursNeeded: number | null;
  transportMode: TransportMode;
  preferences: FamilyPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface SavedProgram {
  id: string;
  familyId: string;
  programId: string;
  status: SavedProgramStatus;
  notes: string | null;
  reminderLeadDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface GeocodeCache {
  id: string;
  addressHash: string;
  coordinates: { lng: number; lat: number };
  attendanceAreaId: string | null;
  provider: "mapbox";
  cachedAt: string;
}

// ============================================================
// Composite types (joins)
// ============================================================

export interface ProgramWithDetails extends Program {
  tags: ProgramTag[];
  schedules: ProgramSchedule[];
  languages: ProgramLanguage[];
  costs: ProgramCost[];
  deadlines: ProgramDeadline[];
  sfusdLinkage: ProgramSfusdLinkage | null;
}

// ============================================================
// Match scoring
// ============================================================

export type MatchTier = "strong" | "good" | "partial" | "hidden";

export interface MatchResult {
  programId: string;
  tier: MatchTier;
  score: number; // 0-100, internal only
  filtered: boolean; // true if excluded by hard filter
  filterReason: string | null; // which hard filter excluded it
}
