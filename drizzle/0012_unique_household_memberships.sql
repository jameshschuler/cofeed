DELETE FROM cofeed.household_members duplicate
USING cofeed.household_members keeper
WHERE duplicate.household_id = keeper.household_id
  AND duplicate.user_id = keeper.user_id
  AND duplicate.id > keeper.id;

CREATE UNIQUE INDEX IF NOT EXISTS household_members_household_user_unique
  ON cofeed.household_members (household_id, user_id);

CREATE OR REPLACE FUNCTION cofeed.list_my_households()
RETURNS TABLE (
  household_id uuid,
  household_name text,
  join_code text,
  member_role cofeed.role
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = cofeed, public
AS $$
  SELECT DISTINCT ON (h.id)
    h.id, h.name, h.join_code, hm.role
  FROM cofeed.household_members hm
  JOIN cofeed.households h ON h.id = hm.household_id
  WHERE hm.user_id = auth.uid()
  ORDER BY h.id, h.name;
$$;

NOTIFY pgrst, 'reload schema';
