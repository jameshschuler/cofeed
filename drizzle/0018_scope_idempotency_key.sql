-- Scope idempotency keys per baby instead of globally, so unrelated households can
-- never share/leak a row via a coincidental (or guessed) idempotency key collision.
ALTER TABLE cofeed.feed_logs
  DROP CONSTRAINT IF EXISTS feed_logs_idempotency_key_unique;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'cofeed.feed_logs'::regclass
      AND conname = 'feed_logs_baby_idempotency_key_unique'
  ) THEN
    ALTER TABLE cofeed.feed_logs
      ADD CONSTRAINT feed_logs_baby_idempotency_key_unique UNIQUE (baby_id, idempotency_key);
  END IF;
END $$;

ALTER TABLE cofeed.pumping_logs
  DROP CONSTRAINT IF EXISTS pumping_logs_idempotency_key_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'cofeed.pumping_logs'::regclass
      AND conname = 'pumping_logs_baby_idempotency_key_unique'
  ) THEN
    ALTER TABLE cofeed.pumping_logs
      ADD CONSTRAINT pumping_logs_baby_idempotency_key_unique UNIQUE (baby_id, idempotency_key);
  END IF;
END $$;
