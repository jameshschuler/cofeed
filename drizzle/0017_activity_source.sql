ALTER TABLE cofeed.feed_logs
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'cofeed';

ALTER TABLE cofeed.pumping_logs
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'cofeed';
