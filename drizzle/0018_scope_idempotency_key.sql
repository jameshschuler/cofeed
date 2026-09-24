-- Scope idempotency keys per baby instead of globally, so unrelated households can
-- never share/leak a row via a coincidental (or guessed) idempotency key collision.
ALTER TABLE cofeed.feed_logs DROP CONSTRAINT feed_logs_idempotency_key_unique;
ALTER TABLE cofeed.feed_logs
  ADD CONSTRAINT feed_logs_baby_idempotency_key_unique UNIQUE (baby_id, idempotency_key);

ALTER TABLE cofeed.pumping_logs DROP CONSTRAINT pumping_logs_idempotency_key_key;
ALTER TABLE cofeed.pumping_logs
  ADD CONSTRAINT pumping_logs_baby_idempotency_key_unique UNIQUE (baby_id, idempotency_key);
