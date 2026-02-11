-- SF School Navigator — Seed Data
-- 12 programs (4 full, 4 medium, 4 basic), 3 attendance areas, SFUSD rules
-- All data is fictional but realistic for SF locations

-- ============================================================
-- Attendance Areas (simplified polygons for 3 SF neighborhoods)
-- ============================================================

insert into attendance_areas (id, name, geometry, school_year, linked_elementary_school_ids) values
  (
    'aa000000-0000-0000-0000-000000000001',
    'Noe Valley',
    ST_GeomFromText('POLYGON((-122.438 37.745, -122.425 37.745, -122.425 37.755, -122.438 37.755, -122.438 37.745))', 4326),
    '2026-27',
    array['alvarado-es', 'fairmount-es']
  ),
  (
    'aa000000-0000-0000-0000-000000000002',
    'Mission',
    ST_GeomFromText('POLYGON((-122.425 37.755, -122.410 37.755, -122.410 37.770, -122.425 37.770, -122.425 37.755))', 4326),
    '2026-27',
    array['bryant-es', 'marshall-es']
  ),
  (
    'aa000000-0000-0000-0000-000000000003',
    'Outer Sunset',
    ST_GeomFromText('POLYGON((-122.510 37.750, -122.490 37.750, -122.490 37.760, -122.510 37.760, -122.510 37.750))', 4326),
    '2026-27',
    array['sunset-es', 'ulloa-es']
  );

-- ============================================================
-- SFUSD Rules (sample)
-- ============================================================

insert into sfusd_rules (id, school_year, rule_type, rule_text, explanation_plain, source_url, confidence, effective_date) values
  (
    '5f000000-0000-0000-0000-000000000001',
    '2026-27',
    'attendance-area',
    'Students residing within a school''s attendance area receive priority for enrollment at that school.',
    'If you live in a school''s zone, your child gets priority for kindergarten there.',
    'https://www.sfusd.edu/enrollment',
    'confirmed',
    '2026-08-01'
  ),
  (
    '5f000000-0000-0000-0000-000000000002',
    '2026-27',
    'feeder',
    'Students attending a TK program at a designated feeder school receive tiebreaker priority for the linked elementary school.',
    'Attending TK at a feeder school gives your child a slight advantage for kindergarten enrollment at the connected elementary school.',
    'https://www.sfusd.edu/enrollment',
    'likely',
    '2026-08-01'
  ),
  (
    '5f000000-0000-0000-0000-000000000003',
    '2026-27',
    'tiebreaker',
    'When a school is oversubscribed, siblings of current students receive first tiebreaker priority.',
    'If your older child already attends a school, your younger child gets priority there.',
    'https://www.sfusd.edu/enrollment',
    'confirmed',
    '2026-08-01'
  );

-- ============================================================
-- Programs — Fully Enriched (4 programs, completeness > 80)
-- ============================================================

insert into programs (id, name, slug, address, coordinates, phone, website, primary_type, license_number, license_status, logo_url, featured_image_url, age_min_months, age_max_months, potty_training_required, data_completeness_score, last_verified_at, data_source) values
  (
    'b0000000-0000-0000-0000-000000000001',
    'Sunshine Valley Preschool',
    'sunshine-valley-preschool-noe-valley',
    '4012 24th Street, San Francisco, CA 94114',
    ST_SetSRID(ST_MakePoint(-122.4330, 37.7510), 4326),
    '(415) 555-0101',
    'https://sunshinevalleypreschool.example.com',
    'center',
    '384001001',
    'active',
    null,
    null,
    24, 60, false, 92,
    '2026-01-20T00:00:00Z',
    'ccl'
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'Mission Montessori Academy',
    'mission-montessori-academy-mission',
    '2890 Mission Street, San Francisco, CA 94110',
    ST_SetSRID(ST_MakePoint(-122.4185, 37.7620), 4326),
    '(415) 555-0102',
    'https://missionmontessori.example.com',
    'montessori',
    '384001002',
    'active',
    null,
    null,
    18, 72, true, 88,
    '2026-01-15T00:00:00Z',
    'ccl'
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'SFUSD Alvarado Early Education',
    'sfusd-alvarado-early-education-noe-valley',
    '625 Douglass Street, San Francisco, CA 94114',
    ST_SetSRID(ST_MakePoint(-122.4380, 37.7490), 4326),
    '(415) 555-0103',
    'https://www.sfusd.edu/school/alvarado',
    'sfusd-prek',
    null,
    null,
    null,
    null,
    48, 60, false, 85,
    '2026-02-01T00:00:00Z',
    'sfusd'
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'Little Explorers Bilingual',
    'little-explorers-bilingual-mission',
    '3150 18th Street, San Francisco, CA 94110',
    ST_SetSRID(ST_MakePoint(-122.4155, 37.7625), 4326),
    '(415) 555-0104',
    'https://littleexplorers.example.com',
    'center',
    '384001004',
    'active',
    null,
    null,
    12, 60, false, 90,
    '2026-01-25T00:00:00Z',
    'ccl'
  );

-- Tags for fully enriched programs
insert into program_tags (program_id, tag) values
  ('b0000000-0000-0000-0000-000000000001', 'play-based'),
  ('b0000000-0000-0000-0000-000000000001', 'outdoor'),
  ('b0000000-0000-0000-0000-000000000001', 'accepts-subsidies'),
  ('b0000000-0000-0000-0000-000000000002', 'montessori'),
  ('b0000000-0000-0000-0000-000000000002', 'academic'),
  ('b0000000-0000-0000-0000-000000000003', 'sfusd'),
  ('b0000000-0000-0000-0000-000000000003', 'play-based'),
  ('b0000000-0000-0000-0000-000000000003', 'accepts-subsidies'),
  ('b0000000-0000-0000-0000-000000000004', 'play-based'),
  ('b0000000-0000-0000-0000-000000000004', 'language-immersion'),
  ('b0000000-0000-0000-0000-000000000004', 'accepts-subsidies');

-- Schedules for enriched programs
insert into program_schedules (program_id, schedule_type, days_per_week, open_time, close_time, extended_care_available, summer_program, operates, monthly_cost_low, monthly_cost_high, registration_fee, deposit) values
  ('b0000000-0000-0000-0000-000000000001', 'full-day', 5, '07:30', '18:00', true, true, 'full-year', 1850, 2200, 150, 500),
  ('b0000000-0000-0000-0000-000000000001', 'half-day-am', 5, '07:30', '12:30', false, false, 'school-year', 1200, 1400, 150, 500),
  ('b0000000-0000-0000-0000-000000000002', 'full-day', 5, '08:00', '17:30', false, false, 'school-year', 2400, 2800, 300, 800),
  ('b0000000-0000-0000-0000-000000000002', 'half-day-am', 3, '08:00', '12:00', false, false, 'school-year', 1600, 1800, 300, 500),
  ('b0000000-0000-0000-0000-000000000003', 'full-day', 5, '08:00', '14:30', false, false, 'school-year', 0, 0, 0, 0),
  ('b0000000-0000-0000-0000-000000000004', 'full-day', 5, '07:30', '18:00', true, true, 'full-year', 2100, 2500, 200, 600),
  ('b0000000-0000-0000-0000-000000000004', 'full-day', 3, '07:30', '18:00', true, false, 'full-year', 1400, 1700, 200, 400);

-- Languages for enriched programs
insert into program_languages (program_id, language, immersion_type) values
  ('b0000000-0000-0000-0000-000000000001', 'English', 'full'),
  ('b0000000-0000-0000-0000-000000000002', 'English', 'full'),
  ('b0000000-0000-0000-0000-000000000003', 'English', 'full'),
  ('b0000000-0000-0000-0000-000000000003', 'Spanish', 'dual'),
  ('b0000000-0000-0000-0000-000000000004', 'English', 'dual'),
  ('b0000000-0000-0000-0000-000000000004', 'Spanish', 'dual'),
  ('b0000000-0000-0000-0000-000000000004', 'Mandarin', 'exposure');

-- Costs for enriched programs
insert into program_costs (program_id, school_year, tuition_monthly_low, tuition_monthly_high, registration_fee, deposit, accepts_subsidies, financial_aid_available) values
  ('b0000000-0000-0000-0000-000000000001', '2026-27', 1850, 2200, 150, 500, true, true),
  ('b0000000-0000-0000-0000-000000000002', '2026-27', 2400, 2800, 300, 800, false, true),
  ('b0000000-0000-0000-0000-000000000003', '2026-27', 0, 0, 0, 0, true, false),
  ('b0000000-0000-0000-0000-000000000004', '2026-27', 2100, 2500, 200, 600, true, true);

-- Deadlines for enriched programs
insert into program_deadlines (program_id, school_year, deadline_type, date, description, source_url, verified_at) values
  ('b0000000-0000-0000-0000-000000000001', '2026-27', 'application-open', '2026-01-15', 'Applications open for 2026-27 school year', 'https://sunshinevalleypreschool.example.com/apply', '2026-01-20T00:00:00Z'),
  ('b0000000-0000-0000-0000-000000000001', '2026-27', 'application-close', '2026-03-31', 'Application deadline for 2026-27', 'https://sunshinevalleypreschool.example.com/apply', '2026-01-20T00:00:00Z'),
  ('b0000000-0000-0000-0000-000000000002', '2026-27', 'application-open', '2026-02-01', 'Tour required before applying', 'https://missionmontessori.example.com/admissions', '2026-01-15T00:00:00Z'),
  ('b0000000-0000-0000-0000-000000000002', '2026-27', 'application-close', '2026-04-15', 'Rolling admissions close April 15', 'https://missionmontessori.example.com/admissions', '2026-01-15T00:00:00Z'),
  ('b0000000-0000-0000-0000-000000000003', '2026-27', 'application-open', '2025-11-01', 'SFUSD Pre-K application window opens', 'https://www.sfusd.edu/enrollment', '2026-02-01T00:00:00Z'),
  ('b0000000-0000-0000-0000-000000000003', '2026-27', 'application-close', '2026-01-31', 'SFUSD Pre-K application deadline', 'https://www.sfusd.edu/enrollment', '2026-02-01T00:00:00Z'),
  ('b0000000-0000-0000-0000-000000000003', '2026-27', 'notification', '2026-03-15', 'Placement notifications sent', 'https://www.sfusd.edu/enrollment', '2026-02-01T00:00:00Z'),
  ('b0000000-0000-0000-0000-000000000004', '2026-27', 'application-open', '2026-01-10', 'Applications accepted year-round', 'https://littleexplorers.example.com/enroll', '2026-01-25T00:00:00Z');

-- SFUSD linkage for SFUSD program
insert into program_sfusd_linkage (program_id, attendance_area_id, school_year, feeder_elementary_school, tiebreaker_eligible, rule_version_id) values
  ('b0000000-0000-0000-0000-000000000003', 'aa000000-0000-0000-0000-000000000001', '2026-27', 'Alvarado Elementary', true, '5f000000-0000-0000-0000-000000000002');

-- ============================================================
-- Programs — Medium Completeness (4 programs, completeness 50-70)
-- ============================================================

insert into programs (id, name, slug, address, coordinates, phone, website, primary_type, license_number, license_status, age_min_months, age_max_months, potty_training_required, data_completeness_score, last_verified_at, data_source) values
  (
    'b0000000-0000-0000-0000-000000000005',
    'Golden Gate Kids',
    'golden-gate-kids-outer-sunset',
    '2345 Taraval Street, San Francisco, CA 94116',
    ST_SetSRID(ST_MakePoint(-122.4950, 37.7440), 4326),
    '(415) 555-0105',
    'https://goldengatekids.example.com',
    'center',
    '384001005',
    'active',
    24, 60, false, 65,
    '2025-11-10T00:00:00Z',
    'ccl'
  ),
  (
    'b0000000-0000-0000-0000-000000000006',
    'St. Cecilia PreK',
    'st-cecilia-prek-outer-sunset',
    '2550 17th Avenue, San Francisco, CA 94116',
    ST_SetSRID(ST_MakePoint(-122.4760, 37.7550), 4326),
    '(415) 555-0106',
    null,
    'religious',
    '384001006',
    'active',
    36, 60, true, 58,
    '2025-10-20T00:00:00Z',
    'ccl'
  ),
  (
    'b0000000-0000-0000-0000-000000000007',
    'Noe Valley Nursery School',
    'noe-valley-nursery-school-noe-valley',
    '1050 Sanchez Street, San Francisco, CA 94114',
    ST_SetSRID(ST_MakePoint(-122.4310, 37.7515), 4326),
    '(415) 555-0107',
    'https://noevalleynursery.example.com',
    'co-op',
    '384001007',
    'active',
    24, 48, false, 62,
    '2025-12-05T00:00:00Z',
    'ccl'
  ),
  (
    'b0000000-0000-0000-0000-000000000008',
    'SFUSD Bryant TK',
    'sfusd-bryant-tk-mission',
    '1050 York Street, San Francisco, CA 94110',
    ST_SetSRID(ST_MakePoint(-122.4090, 37.7595), 4326),
    '(415) 555-0108',
    'https://www.sfusd.edu/school/bryant',
    'sfusd-tk',
    null,
    null,
    57, 66, false, 60,
    '2026-01-10T00:00:00Z',
    'sfusd'
  );

-- Tags for medium programs
insert into program_tags (program_id, tag) values
  ('b0000000-0000-0000-0000-000000000005', 'play-based'),
  ('b0000000-0000-0000-0000-000000000006', 'religious'),
  ('b0000000-0000-0000-0000-000000000006', 'academic'),
  ('b0000000-0000-0000-0000-000000000007', 'co-op'),
  ('b0000000-0000-0000-0000-000000000007', 'play-based'),
  ('b0000000-0000-0000-0000-000000000008', 'sfusd');

-- Schedules for medium programs (fewer options)
insert into program_schedules (program_id, schedule_type, days_per_week, open_time, close_time, operates, monthly_cost_low, monthly_cost_high) values
  ('b0000000-0000-0000-0000-000000000005', 'full-day', 5, '07:00', '18:00', 'full-year', 1600, 1900),
  ('b0000000-0000-0000-0000-000000000006', 'half-day-am', 5, '08:30', '12:00', 'school-year', 800, 1000),
  ('b0000000-0000-0000-0000-000000000007', 'half-day-am', 3, '09:00', '12:30', 'school-year', 900, 1100),
  ('b0000000-0000-0000-0000-000000000008', 'full-day', 5, '08:00', '14:30', 'school-year', 0, 0);

-- Languages for medium programs
insert into program_languages (program_id, language, immersion_type) values
  ('b0000000-0000-0000-0000-000000000005', 'English', 'full'),
  ('b0000000-0000-0000-0000-000000000006', 'English', 'full'),
  ('b0000000-0000-0000-0000-000000000007', 'English', 'full'),
  ('b0000000-0000-0000-0000-000000000008', 'English', 'full');

-- SFUSD linkage for Bryant TK
insert into program_sfusd_linkage (program_id, attendance_area_id, school_year, feeder_elementary_school, tiebreaker_eligible, rule_version_id) values
  ('b0000000-0000-0000-0000-000000000008', 'aa000000-0000-0000-0000-000000000002', '2026-27', 'Bryant Elementary', true, '5f000000-0000-0000-0000-000000000002');

-- ============================================================
-- Programs — Basic Listings (4 programs, completeness < 50)
-- CCL data only: name, address, license, capacity, type
-- ============================================================

insert into programs (id, name, slug, address, coordinates, phone, primary_type, license_number, license_status, age_min_months, age_max_months, data_completeness_score, data_source) values
  (
    'b0000000-0000-0000-0000-000000000009',
    'Maria''s Family Childcare',
    'marias-family-childcare-mission',
    '2678 Folsom Street, San Francisco, CA 94110',
    ST_SetSRID(ST_MakePoint(-122.4140, 37.7560), 4326),
    '(415) 555-0109',
    'family-home',
    '384001009',
    'active',
    0, 60, 25,
    'ccl'
  ),
  (
    'b0000000-0000-0000-0000-000000000010',
    'Wong Family Daycare',
    'wong-family-daycare-outer-sunset',
    '1890 44th Avenue, San Francisco, CA 94122',
    ST_SetSRID(ST_MakePoint(-122.5020, 37.7530), 4326),
    '(415) 555-0110',
    'family-home',
    '384001010',
    'active',
    0, 48, 22,
    'ccl'
  ),
  (
    'b0000000-0000-0000-0000-000000000011',
    'Excelsior Child Development Center',
    'excelsior-child-development-center-excelsior',
    '4750 Mission Street, San Francisco, CA 94112',
    ST_SetSRID(ST_MakePoint(-122.4370, 37.7210), 4326),
    '(415) 555-0111',
    'center',
    '384001011',
    'active',
    24, 60, 30,
    'ccl'
  ),
  (
    'b0000000-0000-0000-0000-000000000012',
    'Bayview Head Start',
    'bayview-head-start-bayview',
    '1550 Thomas Avenue, San Francisco, CA 94124',
    ST_SetSRID(ST_MakePoint(-122.3920, 37.7310), 4326),
    '(415) 555-0112',
    'head-start',
    '384001012',
    'active',
    36, 60, 35,
    'ccl'
  );

-- Basic programs have minimal tags
insert into program_tags (program_id, tag) values
  ('b0000000-0000-0000-0000-000000000009', 'accepts-subsidies'),
  ('b0000000-0000-0000-0000-000000000012', 'accepts-subsidies'),
  ('b0000000-0000-0000-0000-000000000012', 'head-start');

-- ============================================================
-- Sample Field Provenance (for enriched programs)
-- ============================================================

insert into field_provenance (program_id, field_name, value_text, source, raw_snippet, extracted_at, verified_at) values
  ('b0000000-0000-0000-0000-000000000001', 'tuition', '$1,850-$2,200/month', 'website-scrape', 'Full-time tuition ranges from $1,850 to $2,200 per month depending on age group.', '2026-01-18T00:00:00Z', '2026-01-20T00:00:00Z'),
  ('b0000000-0000-0000-0000-000000000001', 'philosophy', 'Play-based learning with outdoor emphasis', 'website-scrape', 'Our curriculum is rooted in play-based learning with daily outdoor exploration time.', '2026-01-18T00:00:00Z', '2026-01-20T00:00:00Z'),
  ('b0000000-0000-0000-0000-000000000002', 'tuition', '$2,400-$2,800/month', 'website-scrape', 'Montessori program tuition: $2,400/month (3-day) to $2,800/month (5-day).', '2026-01-13T00:00:00Z', '2026-01-15T00:00:00Z'),
  ('b0000000-0000-0000-0000-000000000004', 'languages', 'English/Spanish dual immersion, Mandarin exposure', 'website-scrape', 'We offer a dual-language English/Spanish program with weekly Mandarin exposure classes.', '2026-01-22T00:00:00Z', '2026-01-25T00:00:00Z');
