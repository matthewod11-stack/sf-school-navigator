-- Phase 5: household planning workspace state.
-- Planning state is intentionally lightweight and RLS-protected through saved_programs.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'plan_role') then
    create type plan_role as enum ('active', 'backup', 'inactive');
  end if;
end $$;

alter table saved_programs
  add column if not exists plan_role plan_role not null default 'active',
  add column if not exists plan_child_ids text[] not null default '{}',
  add column if not exists plan_tasks jsonb not null default
    '{"tour":"needed","application":"needed","follow_up":"needed"}'::jsonb;

create index if not exists idx_saved_programs_plan_role
  on saved_programs(family_id, plan_role);

create index if not exists idx_saved_programs_plan_child_ids
  on saved_programs using gin (plan_child_ids);
