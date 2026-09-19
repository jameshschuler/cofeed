CREATE OR REPLACE FUNCTION "cofeed"."list_my_households"()
RETURNS TABLE (
  household_id uuid,
  household_name text,
  join_code text,
  member_role "cofeed"."role"
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = cofeed, public
AS $$
  SELECT h.id, h.name, h.join_code, hm.role
  FROM cofeed.household_members hm
  JOIN cofeed.households h ON h.id = hm.household_id
  WHERE hm.user_id = auth.uid()
  ORDER BY h.name;
$$;

CREATE OR REPLACE FUNCTION "cofeed"."leave_household"(p_household_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = cofeed, public
AS $$
  DELETE FROM cofeed.household_members
  WHERE household_id = p_household_id
    AND user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION "cofeed"."list_my_households"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "cofeed"."leave_household"(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "cofeed"."list_my_households"() TO authenticated;
GRANT EXECUTE ON FUNCTION "cofeed"."leave_household"(uuid) TO authenticated;
NOTIFY pgrst, 'reload schema';
