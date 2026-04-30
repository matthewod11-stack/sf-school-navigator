-- Phase 5: subsidy-aware cost planner metadata.
-- Stores only broad family estimate bands, never exact household income.

alter table families
  add column if not exists cost_estimate_band text not null default 'unknown';

alter table families
  drop constraint if exists families_cost_estimate_band_valid;

alter table families
  add constraint families_cost_estimate_band_valid
  check (
    cost_estimate_band in (
      'unknown',
      'sticker-only',
      'elfa-free-0-110-ami',
      'elfa-full-credit-111-150-ami',
      'elfa-half-credit-151-200-ami',
      'not-eligible-over-200-ami'
    )
  );

alter table program_costs
  add column if not exists elfa_participating boolean,
  add column if not exists elfa_source_url text,
  add column if not exists elfa_verified_at timestamptz;

create index if not exists idx_program_costs_elfa_participating
  on program_costs(elfa_participating)
  where elfa_participating is true;
