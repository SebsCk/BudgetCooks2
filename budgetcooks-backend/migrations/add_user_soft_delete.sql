-- Soft-delete support for users
ALTER TABLE users ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN deleted_at DATETIME DEFAULT NULL;
