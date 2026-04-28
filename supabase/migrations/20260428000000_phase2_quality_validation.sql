-- Phase 2: Data Validation & Trust

alter table programs
  add column if not exists url_validation_status text
    check (url_validation_status in ('valid', 'redirect', 'broken', 'timeout', 'dns_failure')),
  add column if not exists url_validation_checked_at timestamptz,
  add column if not exists url_final_url text,
  add column if not exists address_validation_status text
    check (
      address_validation_status in (
        'valid',
        'mismatch',
        'low_relevance',
        'outside_sf',
        'missing_address',
        'missing_coordinates',
        'geocode_failed'
      )
    ),
  add column if not exists address_validation_checked_at timestamptz,
  add column if not exists address_mismatch_meters numeric(10, 2),
  add column if not exists address_relevance_score numeric(4, 3),
  add column if not exists data_quality_tier text
    check (data_quality_tier in ('skeletal', 'basic', 'adequate', 'complete')),
  add column if not exists data_quality_tier_checked_at timestamptz;

create index if not exists idx_programs_url_validation_status
  on programs(url_validation_status);

create index if not exists idx_programs_address_validation_status
  on programs(address_validation_status);

create index if not exists idx_programs_data_quality_tier
  on programs(data_quality_tier);

