CREATE OR REPLACE FUNCTION cofeed.is_household_member(p_household_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = cofeed, auth, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM cofeed.household_members hm
    WHERE hm.household_id = p_household_id
      AND hm.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION cofeed.is_household_owner(p_household_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = cofeed, auth, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM cofeed.household_members hm
    WHERE hm.household_id = p_household_id
      AND hm.user_id = auth.uid()
      AND hm.role = 'owner'
  );
$$;

CREATE OR REPLACE FUNCTION cofeed.can_write_household(p_household_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = cofeed, auth, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM cofeed.household_members hm
    WHERE hm.household_id = p_household_id
      AND hm.user_id = auth.uid()
      AND hm.role IN ('owner', 'caregiver')
  );
$$;

CREATE OR REPLACE FUNCTION cofeed.is_empty_household(p_household_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = cofeed, auth, public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM cofeed.household_members hm
    WHERE hm.household_id = p_household_id
  );
$$;

REVOKE ALL ON FUNCTION cofeed.is_household_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION cofeed.is_household_owner(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION cofeed.can_write_household(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION cofeed.is_empty_household(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cofeed.is_household_member(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION cofeed.is_household_owner(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION cofeed.can_write_household(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION cofeed.is_empty_household(uuid) TO anon, authenticated, service_role;

ALTER TABLE cofeed.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE cofeed.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cofeed.babies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cofeed.feed_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cofeed.pumping_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cofeed.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS households_member_select ON cofeed.households;
CREATE POLICY households_member_select ON cofeed.households
FOR SELECT TO authenticated
USING (cofeed.is_household_member(id));

DROP POLICY IF EXISTS households_owner_insert ON cofeed.households;
CREATE POLICY households_owner_insert ON cofeed.households
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS households_owner_update ON cofeed.households;
CREATE POLICY households_owner_update ON cofeed.households
FOR UPDATE TO authenticated
USING (cofeed.is_household_owner(id))
WITH CHECK (cofeed.is_household_owner(id));

DROP POLICY IF EXISTS household_members_member_select ON cofeed.household_members;
CREATE POLICY household_members_member_select ON cofeed.household_members
FOR SELECT TO authenticated
USING (cofeed.is_household_member(household_id));

DROP POLICY IF EXISTS household_members_self_insert ON cofeed.household_members;
CREATE POLICY household_members_self_insert ON cofeed.household_members
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    (role = 'owner' AND cofeed.is_empty_household(household_id))
    OR (role = 'caregiver' AND cofeed.is_household_member(household_id))
  )
);

DROP POLICY IF EXISTS household_members_owner_update ON cofeed.household_members;
CREATE POLICY household_members_owner_update ON cofeed.household_members
FOR UPDATE TO authenticated
USING (cofeed.is_household_owner(household_id))
WITH CHECK (cofeed.is_household_owner(household_id));

DROP POLICY IF EXISTS household_members_owner_delete ON cofeed.household_members;
CREATE POLICY household_members_owner_delete ON cofeed.household_members
FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR (cofeed.is_household_owner(household_id) AND user_id <> auth.uid())
);

DROP POLICY IF EXISTS babies_member_select ON cofeed.babies;
CREATE POLICY babies_member_select ON cofeed.babies
FOR SELECT TO authenticated
USING (cofeed.is_household_member(household_id));

DROP POLICY IF EXISTS babies_member_write ON cofeed.babies;
CREATE POLICY babies_member_write ON cofeed.babies
FOR INSERT TO authenticated
WITH CHECK (cofeed.can_write_household(household_id));

CREATE POLICY babies_member_update ON cofeed.babies
FOR UPDATE TO authenticated
USING (cofeed.can_write_household(household_id))
WITH CHECK (cofeed.can_write_household(household_id));

DROP POLICY IF EXISTS babies_member_delete ON cofeed.babies;
CREATE POLICY babies_member_delete ON cofeed.babies
FOR DELETE TO authenticated
USING (cofeed.is_household_owner(household_id));

DROP POLICY IF EXISTS feed_logs_member_select ON cofeed.feed_logs;
CREATE POLICY feed_logs_member_select ON cofeed.feed_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cofeed.babies b
    WHERE b.id = baby_id AND cofeed.is_household_member(b.household_id)
  )
);
  DROP POLICY IF EXISTS babies_member_update ON cofeed.babies;

DROP POLICY IF EXISTS feed_logs_member_insert ON cofeed.feed_logs;
CREATE POLICY feed_logs_member_insert ON cofeed.feed_logs
FOR INSERT TO authenticated
WITH CHECK (
  created_by_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM cofeed.babies b
    WHERE b.id = baby_id AND cofeed.can_write_household(b.household_id)
  )
);

DROP POLICY IF EXISTS feed_logs_member_update ON cofeed.feed_logs;
CREATE POLICY feed_logs_member_update ON cofeed.feed_logs
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cofeed.babies b
    WHERE b.id = baby_id AND cofeed.can_write_household(b.household_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cofeed.babies b
    WHERE b.id = baby_id AND cofeed.can_write_household(b.household_id)
  )
);

DROP POLICY IF EXISTS feed_logs_member_delete ON cofeed.feed_logs;
CREATE POLICY feed_logs_member_delete ON cofeed.feed_logs
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cofeed.babies b
    WHERE b.id = baby_id AND cofeed.can_write_household(b.household_id)
  )
);

DROP POLICY IF EXISTS pumping_logs_member_select ON cofeed.pumping_logs;
CREATE POLICY pumping_logs_member_select ON cofeed.pumping_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cofeed.babies b
    WHERE b.id = baby_id AND cofeed.is_household_member(b.household_id)
  )
);

DROP POLICY IF EXISTS pumping_logs_member_insert ON cofeed.pumping_logs;
CREATE POLICY pumping_logs_member_insert ON cofeed.pumping_logs
FOR INSERT TO authenticated
WITH CHECK (
  created_by_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM cofeed.babies b
    WHERE b.id = baby_id AND cofeed.can_write_household(b.household_id)
  )
);

DROP POLICY IF EXISTS user_preferences_self_select ON cofeed.user_preferences;
CREATE POLICY user_preferences_self_select ON cofeed.user_preferences
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_preferences_self_insert ON cofeed.user_preferences;
CREATE POLICY user_preferences_self_insert ON cofeed.user_preferences
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_preferences_self_update ON cofeed.user_preferences;
CREATE POLICY user_preferences_self_update ON cofeed.user_preferences
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DO $$
BEGIN
  IF to_regclass('cofeed.weight_entries') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE cofeed.weight_entries ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS weight_entries_member_all ON cofeed.weight_entries';
    EXECUTE 'CREATE POLICY weight_entries_member_all ON cofeed.weight_entries FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM cofeed.babies b WHERE b.id = baby_id AND cofeed.is_household_member(b.household_id))) WITH CHECK (EXISTS (SELECT 1 FROM cofeed.babies b WHERE b.id = baby_id AND cofeed.can_write_household(b.household_id)))';
  END IF;

  IF to_regclass('cofeed.daily_intake_goals') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE cofeed.daily_intake_goals ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS daily_intake_goals_member_all ON cofeed.daily_intake_goals';
    EXECUTE 'CREATE POLICY daily_intake_goals_member_all ON cofeed.daily_intake_goals FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM cofeed.babies b WHERE b.id = baby_id AND cofeed.is_household_member(b.household_id))) WITH CHECK (EXISTS (SELECT 1 FROM cofeed.babies b WHERE b.id = baby_id AND cofeed.can_write_household(b.household_id)))';
  END IF;

  IF to_regclass('cofeed.diaper_logs') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE cofeed.diaper_logs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS diaper_logs_member_all ON cofeed.diaper_logs';
    EXECUTE 'CREATE POLICY diaper_logs_member_all ON cofeed.diaper_logs FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM cofeed.babies b WHERE b.id = baby_id AND cofeed.is_household_member(b.household_id))) WITH CHECK (EXISTS (SELECT 1 FROM cofeed.babies b WHERE b.id = baby_id AND cofeed.can_write_household(b.household_id)))';
  END IF;
END $$;
