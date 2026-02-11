# Privacy & Data Architecture — SF School Navigator

## Principles

1. **Minimize PII collection** — only collect what's needed for matching
2. **Geocode and discard** — never store raw addresses
3. **Fuzz locations** — store approximate coordinates (~200m) not exact
4. **Boolean over free-text** — special needs is a flag, not a description
5. **Age over DOB** — store child's age in months, not date of birth
6. **RLS everywhere** — Row Level Security on all user-facing tables

## Data Handling

### Home Address
- User enters address in intake wizard
- Address is geocoded via Mapbox API (server-side)
- Coordinates are fuzzed with ~200m random offset
- Attendance area is determined via PostGIS point-in-polygon
- **Stored:** fuzzed coordinates + attendance area ID
- **Discarded:** raw address string (never written to DB or logs)

### Work Address (future)
- Same geocode-and-discard pattern as home address
- Fuzzed coordinates stored for commute calculation
- Raw address never persisted

### Child Date of Birth
- Converted to `age_in_months` at intake time
- Exact DOB is not stored in the database
- Age in months is sufficient for eligibility matching

### Special Needs
- Stored as boolean only (`has_special_needs: true/false/null`)
- No free-text field for health conditions or diagnoses
- Used only to flag programs with special needs support

### Family Preferences
- Stored as structured JSONB (arrays of strings)
- No free-text fields that could contain PII

## Database Security

### Row Level Security (RLS)
- **Default deny-all** on every table
- Program data: publicly readable (no authentication required)
- Family data: only accessible by the owning user
- Saved programs: only accessible by the owning user (via family FK)
- User corrections: submitter can read their own; approved corrections are public

### No PII in Logs
- Supabase query logging must not capture parameters on family-related tables
- Application error reporting (Sentry) must not include family data in breadcrumbs
- Analytics events (PostHog) must not include any child or family PII

## Compliance

### CCPA
- Users can request data export (family record + saved programs)
- Users can request deletion (cascade delete via `on delete cascade`)
- No selling of personal information
- Privacy policy clearly states data practices

### COPPA
- We do not collect information directly from children
- All data is provided by parents/guardians
- Age is stored as months, not exact DOB
