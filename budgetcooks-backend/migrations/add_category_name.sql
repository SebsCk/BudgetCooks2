-- Add category_name text column as reliable fallback
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS category_name VARCHAR(80) DEFAULT NULL AFTER category_id;

-- Backfill category_name from the join for existing recipes that have category_id
UPDATE recipes r
  JOIN categories c ON c.id = r.category_id
  SET r.category_name = c.name
  WHERE r.category_id IS NOT NULL AND r.category_name IS NULL;
