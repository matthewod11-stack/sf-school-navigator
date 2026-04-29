-- Phase 3 elementary expansion foundation.
-- Adds elementary program types, canonical grade-level coverage, and child profiles.

alter type program_type add value if not exists 'sfusd-elementary';
alter type program_type add value if not exists 'private-elementary';
alter type program_type add value if not exists 'charter-elementary';

alter type data_source add value if not exists 'cde';

alter table programs
  add column if not exists grade_levels text[] not null default array['prek', 'tk'];

alter table programs
  drop constraint if exists programs_grade_levels_valid;

alter table programs
  add constraint programs_grade_levels_valid
  check (
    grade_levels <@ array['prek', 'tk', 'k', '1', '2', '3', '4', '5']::text[]
  );

update programs
set grade_levels = array['prek']
where primary_type = 'sfusd-prek'
  and grade_levels = array['prek', 'tk']::text[];

update programs
set grade_levels = array['tk']
where primary_type = 'sfusd-tk'
  and grade_levels = array['prek', 'tk']::text[];

create index if not exists idx_programs_grade_levels
  on programs using gin (grade_levels);

alter table families
  add column if not exists children jsonb not null default '[]'::jsonb;

alter table families
  drop constraint if exists families_children_is_array;

alter table families
  add constraint families_children_is_array
  check (jsonb_typeof(children) = 'array');

update families
set children = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'label', 'Child 1',
    'ageMonths', child_age_months,
    'expectedDueDate', child_expected_due_date,
    'pottyTrained', potty_trained,
    'gradeTarget',
      case
        when child_age_months >= 60 then 'k'
        when child_age_months >= 48 then 'tk'
        else 'prek'
      end
  )
)
where children = '[]'::jsonb
  and (
    child_age_months is not null
    or child_expected_due_date is not null
    or potty_trained is not null
  );

create index if not exists idx_families_children
  on families using gin (children);
