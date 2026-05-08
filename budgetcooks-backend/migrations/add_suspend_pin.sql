-- Add suspended flag to users
ALTER TABLE users ADD COLUMN suspended TINYINT(1) NOT NULL DEFAULT 0;

-- Add pinned/featured flag to recipes
ALTER TABLE recipes ADD COLUMN pinned TINYINT(1) NOT NULL DEFAULT 0;
