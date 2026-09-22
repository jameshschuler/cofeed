CREATE TABLE IF NOT EXISTS cofeed.pumping_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id uuid NOT NULL REFERENCES cofeed.babies(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL,
  volume real NOT NULL,
  unit cofeed.volume_unit NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  created_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
