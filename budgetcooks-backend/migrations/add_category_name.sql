-- add_category_name.sql
-- Add category_name column to recipes table as reliable fallback (idempotent)

SET @dbname = DATABASE();
SET @tablename = 'recipes';
SET @columnname = 'category_name';

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE 
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) = 0,
  CONCAT('ALTER TABLE ', @tablename, 
         ' ADD COLUMN ', @columnname, 
         ' VARCHAR(80) DEFAULT NULL AFTER category_id'),
  'SELECT 1'
));

PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill category_name from the join for existing recipes that have category_id
UPDATE recipes r
  JOIN categories c ON c.id = r.category_id
  SET r.category_name = c.name
  WHERE r.category_id IS NOT NULL AND r.category_name IS NULL;