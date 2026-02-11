-- SF School Navigator — Initial Schema
-- Requires: PostGIS extension, Supabase Auth (auth.users)

-- ============================================================
-- Extensions
-- ============================================================

create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ============================================================
-- Enums
-- ============================================================

create type program_type as enum (
  'center',
  'family-home',
  'sfusd-prek',
  'sfusd-tk',
  'head-start',
  'montessori',
  'waldorf',
  'religious',
  'co-op',
  'other'
);

create type schedule_type as enum (
  'full-day',
  'half-day-am',
  'half-day-pm',
  'extended-day'
);

create type schedule_period as enum (
  'school-year',
  'full-year'
);

create type immersion_type as enum (
  'full',
  'dual',
  'exposure'
);

create type deadline_type as enum (
  'application-open',
  'application-close',
  'notification',
  'waitlist'
);

create type sfusd_rule_type as enum (
  'attendance-area',
  'tiebreaker',
  'feeder',
  'lottery'
);

create type confidence_level as enum (
  'confirmed',
  'likely',
  'uncertain'
);

create type data_source as enum (
  'ccl',
  'sfusd',
  'website-scrape',
  'manual',
  'user-correction'
);

create type correction_status as enum (
  'pending',
  'approved',
  'rejected'
);

create type saved_program_status as enum (
  'researching',
  'toured',
  'applied',
  'waitlisted',
  'accepted',
  'enrolled',
  'rejected'
);

create type transport_mode as enum (
  'car',
  'transit',
  'walk',
  'bike'
);

create type geocode_provider as enum (
  'mapbox'
);

-- ============================================================
-- Tables
-- ============================================================

-- Programs (core)
create table programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  address text,
  coordinates extensions.geometry(Point, 4326),
  phone text,
  website text,
  primary_type program_type not null default 'other',
  license_number text unique,
  license_status text,
  logo_url text,
  featured_image_url text,
  age_min_months int,
  age_max_months int,
  potty_training_required boolean,
  data_completeness_score int default 0 check (data_completeness_score between 0 and 100),
  last_verified_at timestamptz,
  data_source data_source not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Program Tags (many-to-many style)
create table program_tags (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  tag text not null,
  unique (program_id, tag)
);

-- Program Schedules
create table program_schedules (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  schedule_type schedule_type not null,
  days_per_week int check (days_per_week between 1 and 7),
  open_time time,
  close_time time,
  extended_care_available boolean default false,
  summer_program boolean default false,
  operates schedule_period default 'full-year',
  monthly_cost_low numeric(10, 2),
  monthly_cost_high numeric(10, 2),
  registration_fee numeric(10, 2),
  deposit numeric(10, 2)
);

-- Program Languages
create table program_languages (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  language text not null,
  immersion_type immersion_type not null default 'exposure',
  unique (program_id, language)
);

-- Program Costs (per school year)
create table program_costs (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  school_year text not null,
  tuition_monthly_low numeric(10, 2),
  tuition_monthly_high numeric(10, 2),
  registration_fee numeric(10, 2),
  deposit numeric(10, 2),
  accepts_subsidies boolean default false,
  financial_aid_available boolean default false,
  unique (program_id, school_year)
);

-- Program Deadlines
create table program_deadlines (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  school_year text not null,
  deadline_type deadline_type not null,
  date date,
  description text,
  generic_deadline_estimate text,
  source_url text,
  verified_at timestamptz
);

-- SFUSD Rules (versioned, temporal)
create table sfusd_rules (
  id uuid primary key default gen_random_uuid(),
  school_year text not null,
  rule_type sfusd_rule_type not null,
  rule_text text not null,
  explanation_plain text,
  source_url text,
  confidence confidence_level not null default 'uncertain',
  effective_date date,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Attendance Areas (polygons)
create table attendance_areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  geometry extensions.geometry(Polygon, 4326) not null,
  school_year text not null,
  linked_elementary_school_ids text[],
  created_at timestamptz not null default now()
);

-- Program ↔ SFUSD Linkage
create table program_sfusd_linkage (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  attendance_area_id uuid not null references attendance_areas(id) on delete cascade,
  school_year text not null,
  feeder_elementary_school text,
  tiebreaker_eligible boolean default false,
  rule_version_id uuid references sfusd_rules(id),
  unique (program_id, attendance_area_id, school_year)
);

-- Field Provenance (audit trail for AI-extracted data)
create table field_provenance (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  field_name text not null,
  value_text text,
  source data_source not null,
  raw_snippet text,
  extracted_at timestamptz not null default now(),
  verified_at timestamptz,
  verified_by text
);

-- User Corrections
create table user_corrections (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  field_name text not null,
  suggested_value text not null,
  submitted_by uuid not null references auth.users(id),
  submitted_at timestamptz not null default now(),
  status correction_status not null default 'pending',
  reviewed_at timestamptz,
  reviewed_by text
);

-- Families (user profiles)
create table families (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  child_age_months int,
  child_expected_due_date date,
  has_special_needs boolean,
  has_multiples boolean default false,
  num_children int default 1,
  potty_trained boolean,
  home_attendance_area_id uuid references attendance_areas(id),
  home_coordinates_fuzzed extensions.geometry(Point, 4326),
  budget_monthly_max numeric(10, 2),
  subsidy_interested boolean default false,
  schedule_days_needed int,
  schedule_hours_needed numeric(4, 1),
  transport_mode transport_mode default 'car',
  preferences jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Saved Programs (family ↔ program junction)
create table saved_programs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  program_id uuid not null references programs(id) on delete cascade,
  status saved_program_status not null default 'researching',
  notes text,
  reminder_lead_days int default 14,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_id, program_id)
);

-- Geocode Cache
create table geocode_cache (
  id uuid primary key default gen_random_uuid(),
  address_hash text not null unique,
  coordinates extensions.geometry(Point, 4326) not null,
  attendance_area_id uuid references attendance_areas(id),
  provider geocode_provider not null default 'mapbox',
  cached_at timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================

-- Spatial indexes (GiST)
create index idx_programs_coordinates on programs using gist (coordinates);
create index idx_attendance_areas_geometry on attendance_areas using gist (geometry);
create index idx_families_home_coordinates on families using gist (home_coordinates_fuzzed);
create index idx_geocode_cache_coordinates on geocode_cache using gist (coordinates);

-- Text search (pg_trgm)
create index idx_programs_name_trgm on programs using gin (name extensions.gin_trgm_ops);

-- Foreign key indexes
create index idx_program_tags_program_id on program_tags(program_id);
create index idx_program_schedules_program_id on program_schedules(program_id);
create index idx_program_languages_program_id on program_languages(program_id);
create index idx_program_costs_program_id on program_costs(program_id);
create index idx_program_deadlines_program_id on program_deadlines(program_id);
create index idx_program_sfusd_linkage_program_id on program_sfusd_linkage(program_id);
create index idx_field_provenance_program_id on field_provenance(program_id);
create index idx_user_corrections_program_id on user_corrections(program_id);
create index idx_saved_programs_family_id on saved_programs(family_id);
create index idx_saved_programs_program_id on saved_programs(program_id);

-- Lookup indexes
create index idx_programs_slug on programs(slug);
create index idx_programs_primary_type on programs(primary_type);
create index idx_programs_data_source on programs(data_source);
create index idx_programs_license_number on programs(license_number);
create index idx_sfusd_rules_school_year on sfusd_rules(school_year);
create index idx_attendance_areas_school_year on attendance_areas(school_year);

-- ============================================================
-- Row Level Security
-- ============================================================

-- Enable RLS on all tables (default deny)
alter table programs enable row level security;
alter table program_tags enable row level security;
alter table program_schedules enable row level security;
alter table program_languages enable row level security;
alter table program_costs enable row level security;
alter table program_deadlines enable row level security;
alter table sfusd_rules enable row level security;
alter table attendance_areas enable row level security;
alter table program_sfusd_linkage enable row level security;
alter table field_provenance enable row level security;
alter table user_corrections enable row level security;
alter table families enable row level security;
alter table saved_programs enable row level security;
alter table geocode_cache enable row level security;

-- Public read access for program data (anyone can browse)
create policy "Programs are publicly readable"
  on programs for select using (true);

create policy "Program tags are publicly readable"
  on program_tags for select using (true);

create policy "Program schedules are publicly readable"
  on program_schedules for select using (true);

create policy "Program languages are publicly readable"
  on program_languages for select using (true);

create policy "Program costs are publicly readable"
  on program_costs for select using (true);

create policy "Program deadlines are publicly readable"
  on program_deadlines for select using (true);

create policy "SFUSD rules are publicly readable"
  on sfusd_rules for select using (true);

create policy "Attendance areas are publicly readable"
  on attendance_areas for select using (true);

create policy "Program SFUSD linkage is publicly readable"
  on program_sfusd_linkage for select using (true);

create policy "Field provenance is publicly readable"
  on field_provenance for select using (true);

create policy "Geocode cache is publicly readable"
  on geocode_cache for select using (true);

-- User corrections: users can submit their own, read all approved
create policy "Users can submit corrections"
  on user_corrections for insert
  with check (auth.uid() = submitted_by);

create policy "Users can read their own corrections"
  on user_corrections for select
  using (auth.uid() = submitted_by or status = 'approved');

-- Families: users can only access their own family record
create policy "Users can read own family"
  on families for select
  using (auth.uid() = user_id);

create policy "Users can insert own family"
  on families for insert
  with check (auth.uid() = user_id);

create policy "Users can update own family"
  on families for update
  using (auth.uid() = user_id);

create policy "Users can delete own family"
  on families for delete
  using (auth.uid() = user_id);

-- Saved programs: users can only access their own (via family)
create policy "Users can read own saved programs"
  on saved_programs for select
  using (
    family_id in (
      select id from families where user_id = auth.uid()
    )
  );

create policy "Users can insert own saved programs"
  on saved_programs for insert
  with check (
    family_id in (
      select id from families where user_id = auth.uid()
    )
  );

create policy "Users can update own saved programs"
  on saved_programs for update
  using (
    family_id in (
      select id from families where user_id = auth.uid()
    )
  );

create policy "Users can delete own saved programs"
  on saved_programs for delete
  using (
    family_id in (
      select id from families where user_id = auth.uid()
    )
  );

-- ============================================================
-- Triggers
-- ============================================================

-- Auto-update updated_at timestamps
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger programs_updated_at
  before update on programs
  for each row execute function update_updated_at();

create trigger families_updated_at
  before update on families
  for each row execute function update_updated_at();

create trigger saved_programs_updated_at
  before update on saved_programs
  for each row execute function update_updated_at();
