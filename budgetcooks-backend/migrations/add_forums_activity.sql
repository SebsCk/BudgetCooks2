-- ── ACTIVITY LOG ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED DEFAULT NULL,
  role       ENUM('member','admin') DEFAULT 'member',
  action     VARCHAR(100) NOT NULL,
  entity     VARCHAR(60)  DEFAULT NULL,
  entity_id  INT UNSIGNED DEFAULT NULL,
  meta       TEXT         DEFAULT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_al_user_id (user_id),
  KEY idx_al_role    (role),
  KEY idx_al_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS forums (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  title      VARCHAR(255) NOT NULL,
  body       TEXT         NOT NULL,
  category   VARCHAR(80)  DEFAULT 'General',
  deleted    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_forums_user_id (user_id),
  CONSTRAINT fk_forums_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS forum_replies (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  forum_id  INT UNSIGNED NOT NULL,
  user_id   INT UNSIGNED NOT NULL,
  body      TEXT         NOT NULL,
  deleted   TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_fr_forum_id (forum_id),
  CONSTRAINT fk_fr_forum FOREIGN KEY (forum_id) REFERENCES forums(id) ON DELETE CASCADE,
  CONSTRAINT fk_fr_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS favorites (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id   INT UNSIGNED NOT NULL,
  recipe_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fav (user_id, recipe_id),
  CONSTRAINT fk_fav_user   FOREIGN KEY (user_id)   REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_fav_recipe FOREIGN KEY (recipe_id) REFERENCES recipes(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
