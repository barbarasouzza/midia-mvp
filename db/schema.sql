PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "user" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','user')) DEFAULT 'user',
  person_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (person_id) REFERENCES person(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_user_username ON "user"(username);


CREATE TABLE IF NOT EXISTS person (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS line (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS system (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('vimeo','youtube')),
  url TEXT NOT NULL,
  published_at TEXT NOT NULL,
  line_id INTEGER,
  system_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT,
  FOREIGN KEY (line_id) REFERENCES line(id) ON DELETE SET NULL,
  FOREIGN KEY (system_id) REFERENCES system(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS media_person (
  media_id INTEGER NOT NULL,
  person_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('responsavel','participante')),
  PRIMARY KEY (media_id, person_id),
  FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
  FOREIGN KEY (person_id) REFERENCES person(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_media_platform ON media(platform);
CREATE INDEX IF NOT EXISTS idx_media_published_at ON media(published_at);
CREATE INDEX IF NOT EXISTS idx_media_line ON media(line_id);
CREATE INDEX IF NOT EXISTS idx_media_system ON media(system_id);
CREATE INDEX IF NOT EXISTS idx_mediaperson_role ON media_person(role);
