-- Add URL-friendly slug column to products (run once on existing databases)
ALTER TABLE products
  ADD COLUMN slug VARCHAR(255) NULL AFTER name;

ALTER TABLE products
  ADD UNIQUE INDEX idx_products_slug (slug);

-- Backfill slugs in application code (see ensureProductSlugs in backend/src/index.ts)
-- or run a one-off script that sets slug from LOWER(REPLACE(name, ' ', '-')) with uniqueness handling.
