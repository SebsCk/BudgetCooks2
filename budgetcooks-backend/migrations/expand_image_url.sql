-- Expand image_url to support base64 data URIs from direct uploads
ALTER TABLE recipes MODIFY COLUMN image_url MEDIUMTEXT DEFAULT NULL;
