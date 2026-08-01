-- Initial schema. One singleton `club` row (id=1); everything else is a
-- plain resource table. JSON-ish nested fields (colors, values, social) are
-- stored as TEXT columns holding JSON — sqlite has no native array/object
-- type and none of these are ever queried by their internal shape.
CREATE TABLE club (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  founded INTEGER NOT NULL,
  league TEXT NOT NULL,
  venue TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  colors_json TEXT NOT NULL,
  description TEXT NOT NULL,
  history TEXT NOT NULL,
  values_json TEXT NOT NULL,
  social_json TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL
);

CREATE TABLE players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  photo TEXT,
  staff INTEGER NOT NULL DEFAULT 0,
  role TEXT,
  number INTEGER,
  position TEXT,
  height TEXT,
  birth_year INTEGER,
  nationality TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  competition TEXT NOT NULL,
  matchday INTEGER,
  date TEXT NOT NULL,
  home TEXT NOT NULL,
  away TEXT NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  venue TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('played', 'upcoming'))
);
CREATE INDEX idx_matches_date ON matches (date);
CREATE INDEX idx_matches_status ON matches (status);

CREATE TABLE standings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rank INTEGER NOT NULL,
  team TEXT NOT NULL,
  played INTEGER NOT NULL,
  won INTEGER NOT NULL,
  lost INTEGER NOT NULL,
  points_for INTEGER NOT NULL,
  points_against INTEGER NOT NULL,
  points INTEGER NOT NULL,
  is_club INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  image TEXT
);
CREATE INDEX idx_news_date ON news (date);

CREATE TABLE gallery_albums (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  cover TEXT
);

CREATE TABLE gallery_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  album_id TEXT NOT NULL REFERENCES gallery_albums (id) ON DELETE CASCADE,
  photo TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_gallery_photos_album ON gallery_photos (album_id);

CREATE TABLE partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('institutionnel', 'majeur', 'officiel')),
  logo TEXT,
  url TEXT
);

CREATE TABLE contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
