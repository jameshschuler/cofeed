ALTER TABLE "cofeed"."households"
  ADD COLUMN "join_code" text;

UPDATE "cofeed"."households"
SET "join_code" = upper(substr(md5(random()::text || id::text), 1, 6))
WHERE "join_code" IS NULL;

ALTER TABLE "cofeed"."households"
  ALTER COLUMN "join_code" SET NOT NULL;

ALTER TABLE "cofeed"."households"
  ADD CONSTRAINT "households_join_code_unique" UNIQUE("join_code");

CREATE OR REPLACE FUNCTION "cofeed"."join_household_by_code"(p_join_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = cofeed, public
AS $$
DECLARE
  matched_household_id uuid;
BEGIN
  SELECT id INTO matched_household_id
  FROM cofeed.households
  WHERE join_code = upper(trim(p_join_code));

  IF matched_household_id IS NULL THEN
    RAISE EXCEPTION 'Household code not found';
  END IF;

  INSERT INTO cofeed.household_members (household_id, user_id, role)
  VALUES (matched_household_id, auth.uid(), 'caregiver')
  ON CONFLICT DO NOTHING;

  RETURN matched_household_id;
END;
$$;

REVOKE ALL ON FUNCTION "cofeed"."join_household_by_code"(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "cofeed"."join_household_by_code"(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
