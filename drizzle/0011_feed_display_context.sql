CREATE OR REPLACE FUNCTION "cofeed"."list_feed_logs"(
  p_baby_id uuid,
  p_since timestamptz DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  started_at timestamptz,
  formula_portion_volume real,
  formula_portion_unit cofeed.volume_unit,
  breast_milk_portion_volume real,
  breast_milk_portion_unit cofeed.volume_unit,
  household_name text,
  logger_email text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = cofeed, auth, public
AS $$
  SELECT
    fl.id,
    fl.started_at,
    fl.formula_portion_volume,
    fl.formula_portion_unit,
    fl.breast_milk_portion_volume,
    fl.breast_milk_portion_unit,
    h.name,
    u.email
  FROM cofeed.feed_logs fl
  JOIN cofeed.babies b ON b.id = fl.baby_id
  JOIN cofeed.households h ON h.id = b.household_id
  JOIN cofeed.household_members hm
    ON hm.household_id = h.id
   AND hm.user_id = auth.uid()
  LEFT JOIN auth.users u ON u.id = fl.created_by_user_id
  WHERE fl.baby_id = p_baby_id
    AND (p_since IS NULL OR fl.started_at >= p_since)
  ORDER BY fl.started_at DESC
  LIMIT 50;
$$;

REVOKE ALL ON FUNCTION "cofeed"."list_feed_logs"(uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "cofeed"."list_feed_logs"(uuid, timestamptz) TO authenticated;
NOTIFY pgrst, 'reload schema';
