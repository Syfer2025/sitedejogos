-- CategoryContent table: stores AI-generated SEO content per category
CREATE TABLE IF NOT EXISTS "CategoryContent" (
  "category"        TEXT NOT NULL,
  "h1"              TEXT NOT NULL DEFAULT '',
  "metaTitle"       TEXT NOT NULL DEFAULT '',
  "metaDescription" TEXT NOT NULL DEFAULT '',
  "intro"           TEXT NOT NULL DEFAULT '',
  "body"            TEXT NOT NULL DEFAULT '',
  "benefitsJson"    TEXT NOT NULL DEFAULT '[]',
  "faqJson"         TEXT NOT NULL DEFAULT '[]',
  "generatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CategoryContent_pkey" PRIMARY KEY ("category")
);
