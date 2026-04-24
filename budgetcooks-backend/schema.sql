-- =============================================================
--  BudgetCooks — MySQL Schema (Final)
--  Engine: InnoDB | Charset: utf8mb4
-- =============================================================

CREATE DATABASE IF NOT EXISTS budgetcooks
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE budgetcooks;

-- -------------------------------------------------------------
--  USERS
-- -------------------------------------------------------------
CREATE TABLE users (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  username      VARCHAR(40)     NOT NULL,
  email         VARCHAR(255)    NOT NULL,
  password_hash VARCHAR(255)    NOT NULL,
  role          ENUM('member','admin') NOT NULL DEFAULT 'member',
  avatar_url    VARCHAR(500)    DEFAULT NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email    (email),
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- -------------------------------------------------------------
--  CATEGORIES
-- -------------------------------------------------------------
CREATE TABLE categories (
  id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name  VARCHAR(80)  NOT NULL,
  slug  VARCHAR(80)  NOT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- -------------------------------------------------------------
--  RECIPES
--  anonymous = 1 hides the author name (but post stays live)
-- -------------------------------------------------------------
CREATE TABLE recipes (
  id              INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED   NOT NULL,
  category_id     INT UNSIGNED   DEFAULT NULL,
  title           VARCHAR(255)   NOT NULL,
  description     TEXT           DEFAULT NULL,
  prep_time_mins  SMALLINT UNSIGNED DEFAULT 0,
  cook_time_mins  SMALLINT UNSIGNED DEFAULT 0,
  servings        TINYINT UNSIGNED  DEFAULT 1,
  estimated_cost  DECIMAL(8,2)   DEFAULT 0.00,
  image_url       VARCHAR(500)   DEFAULT NULL,
  anonymous       TINYINT(1)     NOT NULL DEFAULT 0,
  created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                 ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_recipes_user_id     (user_id),
  KEY idx_recipes_category_id (category_id),
  KEY idx_recipes_created_at  (created_at),

  CONSTRAINT fk_recipes_user
    FOREIGN KEY (user_id)     REFERENCES users(id)       ON DELETE CASCADE,
  CONSTRAINT fk_recipes_category
    FOREIGN KEY (category_id) REFERENCES categories(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- -------------------------------------------------------------
--  STEPS
-- -------------------------------------------------------------
CREATE TABLE steps (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  recipe_id   INT UNSIGNED NOT NULL,
  step_number TINYINT UNSIGNED NOT NULL,
  instruction TEXT         NOT NULL,

  PRIMARY KEY (id),
  KEY idx_steps_recipe_id (recipe_id),

  CONSTRAINT fk_steps_recipe
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- -------------------------------------------------------------
--  INGREDIENTS
-- -------------------------------------------------------------
CREATE TABLE ingredients (
  id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  unit VARCHAR(40)  DEFAULT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_ingredients_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- -------------------------------------------------------------
--  RECIPE_INGREDIENTS
-- -------------------------------------------------------------
CREATE TABLE recipe_ingredients (
  id            INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  recipe_id     INT UNSIGNED   NOT NULL,
  ingredient_id INT UNSIGNED   NOT NULL,
  quantity      DECIMAL(8,2)   DEFAULT NULL,
  notes         VARCHAR(120)   DEFAULT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_recipe_ingredient (recipe_id, ingredient_id),
  KEY idx_ri_ingredient_id (ingredient_id),

  CONSTRAINT fk_ri_recipe
    FOREIGN KEY (recipe_id)     REFERENCES recipes(id)     ON DELETE CASCADE,
  CONSTRAINT fk_ri_ingredient
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- -------------------------------------------------------------
--  COMMENTS
--  parent_id NULL = top-level, set = reply (max depth 1)
-- -------------------------------------------------------------
CREATE TABLE comments (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  recipe_id  INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  parent_id  INT UNSIGNED DEFAULT NULL,
  body       TEXT         NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_comments_recipe_id (recipe_id),
  KEY idx_comments_user_id   (user_id),
  KEY idx_comments_parent_id (parent_id),

  CONSTRAINT fk_comments_recipe
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)  ON DELETE CASCADE,
  CONSTRAINT fk_comments_user
    FOREIGN KEY (user_id)   REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_comments_parent
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- -------------------------------------------------------------
--  LIKES
-- -------------------------------------------------------------
CREATE TABLE likes (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  recipe_id  INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_likes (recipe_id, user_id),
  KEY idx_likes_user_id (user_id),

  CONSTRAINT fk_likes_recipe
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_user
    FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- -------------------------------------------------------------
--  CHALLENGES
--  status: pending → active → closed | pending → rejected
-- -------------------------------------------------------------
CREATE TABLE challenges (
  id            INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  created_by    INT UNSIGNED   NOT NULL,
  title         VARCHAR(255)   NOT NULL,
  description   TEXT           DEFAULT NULL,
  budget_limit  DECIMAL(8,2)   DEFAULT NULL,
  status        ENUM('pending','active','rejected','closed')
                               NOT NULL DEFAULT 'pending',
  starts_at     DATETIME       DEFAULT NULL,
  ends_at       DATETIME       DEFAULT NULL,
  created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_challenges_created_by (created_by),
  KEY idx_challenges_status     (status),

  CONSTRAINT fk_challenges_user
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- -------------------------------------------------------------
--  CHALLENGE_ENTRIES
-- -------------------------------------------------------------
CREATE TABLE challenge_entries (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  challenge_id INT UNSIGNED NOT NULL,
  recipe_id    INT UNSIGNED NOT NULL,
  user_id      INT UNSIGNED NOT NULL,
  submitted_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_entry (challenge_id, user_id),
  KEY idx_ce_recipe_id (recipe_id),

  CONSTRAINT fk_ce_challenge
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
  CONSTRAINT fk_ce_recipe
    FOREIGN KEY (recipe_id)    REFERENCES recipes(id)    ON DELETE CASCADE,
  CONSTRAINT fk_ce_user
    FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- -------------------------------------------------------------
--  REPORTS
--  Either recipe_id or comment_id will be set, not both
-- -------------------------------------------------------------
CREATE TABLE reports (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  reported_by  INT UNSIGNED NOT NULL,
  recipe_id    INT UNSIGNED DEFAULT NULL,
  comment_id   INT UNSIGNED DEFAULT NULL,
  reason       TEXT         DEFAULT NULL,
  resolved     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_reports_recipe_id  (recipe_id),
  KEY idx_reports_comment_id (comment_id),

  CONSTRAINT fk_reports_user
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =============================================================
--  SEED DATA — Categories
-- =============================================================
INSERT INTO categories (name, slug) VALUES
  ('Breakfast',   'breakfast'),
  ('Rice Dishes', 'rice-dishes'),
  ('Soups',       'soups'),
  ('Snacks',      'snacks'),
  ('Merienda',    'merienda'),
  ('One-Pan',     'one-pan'),
  ('Ulam',        'ulam');


-- =============================================================
--  SEED DATA — Admin account
--  Replace hash before deploying:
--  node -e "require('bcrypt').hash('yourpassword',10).then(console.log)"
-- =============================================================

