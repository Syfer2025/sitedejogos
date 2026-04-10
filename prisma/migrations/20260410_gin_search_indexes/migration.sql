-- Enable pg_trgm extension for trigram-based ILIKE search.
-- Supabase has this extension available by default.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram indexes — accelerate `ILIKE '%query%'` on search fields.
-- Note: CONCURRENTLY omitted so this can run inside a transaction block
-- (e.g. Supabase SQL Editor). On a large table, run during low-traffic hours.
CREATE INDEX IF NOT EXISTS "Game_title_trgm_gin"
  ON "Game" USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Game_tags_trgm_gin"
  ON "Game" USING gin (tags gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Game_category_trgm_gin"
  ON "Game" USING gin (category gin_trgm_ops);
