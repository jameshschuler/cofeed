CREATE OR REPLACE FUNCTION "cofeed"."leave_household"(p_household_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = cofeed, public
AS $$
  DELETE FROM cofeed.household_members
  WHERE household_id = p_household_id
    AND user_id = auth.uid()
    AND role <> 'owner';
$$;

NOTIFY pgrst, 'reload schema';