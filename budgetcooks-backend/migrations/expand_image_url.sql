-- Expand image_url to support base64 data URIs from direct uploads
ALTER TABLE recipes MODIFY COLUMN image_url MEDIUMTEXT DEFAULT NULL;

-- Add edited_at columns for forum posts and replies
ALTER TABLE forums ADD COLUMN IF NOT EXISTS edited_at DATETIME DEFAULT NULL;
ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS edited_at DATETIME DEFAULT NULL;
