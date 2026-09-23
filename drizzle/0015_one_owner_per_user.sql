WITH ranked_owners AS (
  SELECT id,
    row_number() OVER (PARTITION BY user_id ORDER BY created_at, id) AS owner_rank
  FROM cofeed.household_members
  WHERE role = 'owner'
)
UPDATE cofeed.household_members hm
SET role = 'caregiver'
FROM ranked_owners ro
WHERE hm.id = ro.id
  AND ro.owner_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS household_members_one_owner_per_user
  ON cofeed.household_members (user_id)
  WHERE role = 'owner';
