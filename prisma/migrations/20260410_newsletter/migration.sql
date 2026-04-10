CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (
  "id"           TEXT NOT NULL,
  "email"        TEXT NOT NULL,
  "locale"       TEXT NOT NULL DEFAULT 'pt-BR',
  "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "active"       BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_email_key"
  ON "NewsletterSubscriber"("email");

CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_active_subscribedAt_idx"
  ON "NewsletterSubscriber"("active", "subscribedAt");
