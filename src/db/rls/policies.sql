-- Enable RLS
alter table cofeed.households enable row level security;
alter table cofeed.household_members enable row level security;
alter table cofeed.babies enable row level security;
alter table cofeed.feed_logs enable row level security;
alter table cofeed.user_preferences enable row level security;

-- Household membership helper predicate (used inline in policies)
-- Assumes auth.uid() is available (Supabase/Postgres JWT claim).

create policy households_member_select on cofeed.households
for select
using (
  exists (
    select 1
    from cofeed.household_members hm
    where hm.household_id = cofeed.households.id
      and hm.user_id = auth.uid()
  )
);

create policy babies_member_all on cofeed.babies
for all
using (
  exists (
    select 1
    from cofeed.household_members hm
    where hm.household_id = cofeed.babies.household_id
      and hm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from cofeed.household_members hm
    where hm.household_id = cofeed.babies.household_id
      and hm.user_id = auth.uid()
      and hm.role in ('owner', 'caregiver')
  )
);

create policy feed_logs_member_all on cofeed.feed_logs
for all
using (
  exists (
    select 1
    from cofeed.babies b
    join cofeed.household_members hm on hm.household_id = b.household_id
    where b.id = cofeed.feed_logs.baby_id
      and hm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from cofeed.babies b
    join cofeed.household_members hm on hm.household_id = b.household_id
    where b.id = cofeed.feed_logs.baby_id
      and hm.user_id = auth.uid()
      and hm.role in ('owner', 'caregiver')
  )
);

create policy user_preferences_self_select on cofeed.user_preferences
for select
using (cofeed.user_preferences.user_id = auth.uid());

create policy user_preferences_self_insert on cofeed.user_preferences
for insert
with check (cofeed.user_preferences.user_id = auth.uid());

create policy user_preferences_self_update on cofeed.user_preferences
for update
using (cofeed.user_preferences.user_id = auth.uid())
with check (cofeed.user_preferences.user_id = auth.uid());
