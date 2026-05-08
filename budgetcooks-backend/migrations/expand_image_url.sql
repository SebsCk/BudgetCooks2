-- Expand image_url to support base64 data URIs
ALTER TABLE recipes MODIFY COLUMN image_url MEDIUMTEXT DEFAULT NULL;

-- Add edited_at to forums (ignore error if already exists)
ALTER TABLE forums ADD COLUMN edited_at DATETIME DEFAULT NULL;

-- Add edited_at to forum_replies (ignore error if already exists)
ALTER TABLE forum_replies ADD COLUMN edited_at DATETIME DEFAULT NULL;
